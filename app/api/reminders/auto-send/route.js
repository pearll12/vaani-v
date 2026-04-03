import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization')
    const secretKey = process.env.CRON_SECRET_KEY
    
    // Verify request is from trusted source (cron job or internal)
    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all unpaid invoices (status = 'invoiced')
    const { data: unpaidOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'invoiced')
      .order('created_at', { ascending: true })

    if (!unpaidOrders || unpaidOrders.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No unpaid invoices found' })
    }

    let remindersSent = 0
    const now = new Date()

    for (const order of unpaidOrders) {
      try {
        const createdAt = new Date(order.created_at)
        const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))

        // Send reminder on day 3, 6, 9, etc.
        if (daysSinceCreation >= 3 && daysSinceCreation % 3 === 0) {
          const items = Array.isArray(order.items) ? order.items : []
          const itemNames = items.map(i => `${i.quantity || 1}× ${i.name}`).join(', ') || 'Items'
          const amt = Number(order.total_amount || 0)
          const grand = +(amt * 1.18).toFixed(2)

          const reminderMessage = daysSinceCreation >= 9 
            ? `🚨 *FINAL REMINDER - Payment Pending*\n\n` +
              `Order #${String(order.id).padStart(4, '0')} is still pending payment!\n\n` +
              `📦 ${itemNames}\n` +
              `💰 Amount: ₹${grand}\n\n` +
              `⚠️ This is your FINAL reminder. Please pay now:\n` +
              `💳 ${order.payment_link || 'Payment link sent earlier'}\n\n` +
              `_BusinessVaani_`
            : `📌 *Payment Reminder*\n\n` +
              `Order #${String(order.id).padStart(4, '0')} is waiting for payment!\n\n` +
              `📦 ${itemNames}\n` +
              `💰 Amount: ₹${grand}\n\n` +
              `Please complete payment:\n` +
              `💳 ${order.payment_link || 'Payment link sent earlier'}\n\n` +
              `_BusinessVaani_`

          await sendWhatsApp(order.customer_phone, reminderMessage)
          remindersSent++

          // Log reminder send
          console.log(`✅ Reminder sent to ${order.customer_phone} for Order #${order.id}`)
        }
      } catch (err) {
        console.error(`Failed to send reminder for Order ${order.id}:`, err.message)
      }
    }

    return NextResponse.json({ 
      sent: remindersSent, 
      total: unpaidOrders.length,
      message: `${remindersSent} reminders sent out of ${unpaidOrders.length} unpaid invoices`
    })
  } catch (err) {
    console.error('Auto-reminder error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET endpoint to check status
export async function GET(req) {
  try {
    const { data: unpaidOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'invoiced')
    
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'paid')

    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')

    return NextResponse.json({
      unpaid: unpaidOrders?.length || 0,
      paid: paidOrders?.length || 0,
      pending: pendingOrders?.length || 0,
      total: (unpaidOrders?.length || 0) + (paidOrders?.length || 0) + (pendingOrders?.length || 0)
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
