import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'

// POST /api/reminders — send reminder for a specific order
// GET  /api/reminders — auto-send reminders for overdue invoiced orders (called by cron)
export async function POST(req) {
  try {
    const { orderId } = await req.json()

    const { data: order } = await supabase
      .from('orders').select('*').eq('id', orderId).single()
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const subtotal   = Number(order.total_amount) || 0
    const grandTotal = +(subtotal * 1.18).toFixed(2)

    const msg = [
      `⏰ *Payment Reminder*`,
      ``,
      `Hi! This is a gentle reminder for your pending payment.`,
      ``,
      `📋 *Order:* INV-${String(order.id).padStart(4, '0')}`,
      `💰 *Amount Due:* ₹${grandTotal.toFixed(2)}`,
      ``,
      order.payment_link
        ? `💳 *Pay now:*\n${order.payment_link}`
        : `Please pay ₹${grandTotal.toFixed(2)} at your earliest convenience.`,
      ``,
      `Thank you! 🙏 — BusinessVaani`,
    ].join('\n')

    await sendWhatsApp(order.customer_phone, msg)

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

export async function GET() {
  try {
    // Find invoiced orders older than 24h that haven't been reminded in 48h
    const cutoff24h  = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const cutoff48h  = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: orders = [] } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'invoiced')
      .lt('invoice_sent_at', cutoff24h)
      .or(`last_reminder_at.is.null,last_reminder_at.lt.${cutoff48h}`)
      .lt('reminder_count', 3) // max 3 reminders
      .order('total_amount', { ascending: false })

    let sent = 0
    for (const order of orders) {
      try {
        const grand = +(Number(order.total_amount) * 1.18).toFixed(2)
        const count = (order.reminder_count || 0) + 1
        const urgency = count === 1 ? '⏰' : count === 2 ? '🔔' : '❗'

        const msg = [
          `${urgency} *Payment Reminder #${count}*`,
          ``,
          `Your invoice INV-${String(order.id).padStart(4, '0')} for *₹${grand.toFixed(2)}* is still unpaid.`,
          ``,
          order.payment_link ? `💳 Pay now: ${order.payment_link}` : `Please pay ₹${grand.toFixed(2)} at your earliest convenience.`,
          ``,
          count >= 3 ? `This is our final reminder. Thank you! — BusinessVaani` : `Thank you! 🙏 — BusinessVaani`,
        ].join('\n')

        await sendWhatsApp(order.customer_phone, msg)

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
