import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export async function GET(req) {
  try {
    // Authenticate cron request (optional depending on Vercel setup, but good practice)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In development, we can allow bypassing this if CRON_SECRET is missing
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    // 1. Calculate time bounds (between 3 days and 4 days ago)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()

    // 2. Fetch peding orders created between 3 and 4 days ago
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .lte('created_at', threeDaysAgo)
      .gte('created_at', fourDaysAgo)

    if (error) throw error

    console.log(`Found ${orders.length} pending orders matching the 3-day reminder criteria.`)

    let sentCount = 0;

    for (const order of orders) {
      try {
        const rawPhone = order.customer_phone || ''
        if (!rawPhone) continue;
        const contactPhone = rawPhone.startsWith('+') ? rawPhone : `+91${rawPhone}`

        let subtotal = Number(order.total_amount) || 0;
        const cgst = +(subtotal * 0.09).toFixed(2);
        const sgst = +(subtotal * 0.09).toFixed(2);
        const grandTotal = +(subtotal + cgst + sgst).toFixed(2);

        // Optional: generate a fresh razorpay link if none exists (or recreate it to be safe)
        const razorpayOrder = await razorpay.paymentLink.create({
          amount: Math.round(grandTotal * 100),
          currency: 'INR',
          accept_partial: false,
          description: `Reminder INV-${String(order.id).padStart(4, '0')}`,
          customer: { contact: contactPhone },
          notify: { sms: false, email: false },
          reminder_enable: false,
          notes: { order_id: String(order.id) },
        })
        const paymentLink = razorpayOrder.short_url

        const message = `⏳ *Payment Reminder* \n\nNamaste! Aapka Vaani se Order #${order.id} ka payment (₹${grandTotal}) abhi pending hai.\n\nKripya is link dwara payment jald se jald puri karein:\n${paymentLink}\n\nDhanyawad!`

        await sendWhatsApp(contactPhone, message)
        sentCount++;
        console.log(`Sent reminder for order #${order.id} to ${contactPhone}`)
      } catch (err) {
        console.error(`Failed to send reminder for order #${order.id}:`, err)
      }
    }

    return NextResponse.json({ success: true, sentCount, totalFound: orders.length })
  } catch (err) {
    console.error('CRON Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
