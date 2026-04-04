import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Helper: Get signed PDF URL from Supabase Storage
async function getInvoicePdfUrl(orderId) {
  const storagePath = `invoice-${orderId}.pdf`
  try {
    const { data, error } = await supabase.storage
      .from('invoices')
      .createSignedUrl(storagePath, 7 * 24 * 60 * 60) // 7 days
    if (error || !data?.signedUrl) return null
    return data.signedUrl
  } catch {
    return null
  }
}

// Helper: Ensure a Razorpay payment link exists for the order
async function ensurePaymentLink(order) {
  if (order.payment_link) return order.payment_link

  const subtotal = Number(order.total_amount) || 0
  const grandTotal = +(subtotal * 1.18).toFixed(2)
  if (grandTotal <= 0) return null

  const rawPhone = order.customer_phone || ''
  const contactPhone = rawPhone.startsWith('+') ? rawPhone : `+91${rawPhone}`

  try {
    const link = await razorpay.paymentLink.create({
      amount: Math.round(grandTotal * 100),
      currency: 'INR',
      accept_partial: false,
      description: `Invoice INV-${String(order.id).padStart(4, '0')}`,
      customer: { contact: contactPhone },
      notify: { sms: false, email: false },
      reminder_enable: false,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/razorpay`,
      callback_method: 'get',
      notes: { order_id: String(order.id) },
    })

    // Save the link back to the order
    await supabase.from('orders').update({ payment_link: link.short_url }).eq('id', order.id)
    return link.short_url
  } catch (err) {
    console.error('Razorpay link creation failed:', err.message)
    return null
  }
}

// POST /api/reminders — send reminder for a specific order
export async function POST(req) {
  try {
    const { orderId } = await req.json()

    const { data: order } = await supabase
      .from('orders').select('*').eq('id', orderId).single()
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const subtotal   = Number(order.total_amount) || 0
    const grandTotal = +(subtotal * 1.18).toFixed(2)

    // Ensure payment link exists
    const paymentLink = await ensurePaymentLink(order)

    // Get invoice PDF URL
    const pdfUrl = await getInvoicePdfUrl(order.id)

    const msg = [
      `⏰ *Payment Reminder*`,
      ``,
      `Hi! This is a gentle reminder for your pending payment.`,
      ``,
      `📋 *Order:* INV-${String(order.id).padStart(4, '0')}`,
      `💰 *Amount Due:* ₹${grandTotal.toFixed(2)}`,
      ``,
      paymentLink
        ? `💳 *Pay now:* ${paymentLink}`
        : `Please pay ₹${grandTotal.toFixed(2)} at your earliest convenience.`,
      ``,
      `Thank you! 🙏 — BusinessVaani`,
    ].join('\n')

    // Send with PDF attachment if available
    await sendWhatsApp(order.customer_phone, msg, pdfUrl || null)

    // Log reminder
    await supabase.from('orders').update({
      last_reminder_at: new Date().toISOString(),
      reminder_count: (order.reminder_count || 0) + 1,
    }).eq('id', orderId)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET /api/reminders — auto-send reminders for overdue invoiced orders (cron)
export async function GET() {
  try {
    const cutoff24h  = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const cutoff48h  = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: orders = [] } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'invoiced')
      .lt('invoice_sent_at', cutoff24h)
      .or(`last_reminder_at.is.null,last_reminder_at.lt.${cutoff48h}`)
      .lt('reminder_count', 3)
      .order('total_amount', { ascending: false })

    let sent = 0
    for (const order of orders) {
      try {
        const grand = +(Number(order.total_amount) * 1.18).toFixed(2)
        const count = (order.reminder_count || 0) + 1
        const urgency = count === 1 ? '⏰' : count === 2 ? '🔔' : '❗'

        // Ensure payment link
        const paymentLink = await ensurePaymentLink(order)

        // Get invoice PDF
        const pdfUrl = await getInvoicePdfUrl(order.id)

        const msg = [
          `${urgency} *Payment Reminder #${count}*`,
          ``,
          `Your invoice INV-${String(order.id).padStart(4, '0')} for *₹${grand.toFixed(2)}* is still unpaid.`,
          ``,
          paymentLink ? `💳 Pay now: ${paymentLink}` : `Please pay ₹${grand.toFixed(2)} at your earliest convenience.`,
          ``,
          count >= 3 ? `This is our final reminder. Thank you! — BusinessVaani` : `Thank you! 🙏 — BusinessVaani`,
        ].join('\n')

        await sendWhatsApp(order.customer_phone, msg, pdfUrl || null)

        await supabase.from('orders').update({
          last_reminder_at: new Date().toISOString(),
          reminder_count: count,
        }).eq('id', order.id)

        sent++
      } catch (e) { console.error('Reminder failed for order', order.id, e.message) }
    }

    return NextResponse.json({ success: true, sent, total: orders.length })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
