import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'

/**
 * Vercel Cron Job — Automatic Payment Reminders
 * 
 * Runs daily at 10:00 AM IST (04:30 UTC).
 * Queries orders where status = 'pending' or 'invoiced' and created_at > 3 days ago.
 * Groups totals by customer phone number and sends a single consolidated reminder.
 * 
 * To protect this endpoint from unauthorized access, we check for 
 * the CRON_SECRET header that Vercel injects automatically.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // allow up to 60s for processing

export async function GET(req) {
  try {
    // ── Auth: Verify Vercel Cron secret (skip in dev) ──
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Find overdue orders (pending/invoiced, older than 3 days, max 3 reminders) ──
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: orders = [], error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'invoiced'])
      .lt('created_at', threeDaysAgo)
      .or(`last_reminder_at.is.null,last_reminder_at.lt.${oneDayAgo}`)
      .lt('reminder_count', 3)
      .order('customer_phone')

    if (error) {
      console.error('Cron: DB query failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (orders.length === 0) {
      console.log('Cron: No overdue orders found.')
      return NextResponse.json({ success: true, sent: 0, message: 'No reminders needed' })
    }

    // ── Group orders by customer phone ──
    const grouped = {}
    for (const order of orders) {
      const phone = order.customer_phone
      if (!phone) continue
      if (!grouped[phone]) grouped[phone] = []
      grouped[phone].push(order)
    }

    let sentCount = 0
    let failCount = 0

    // ── Send one consolidated reminder per customer ──
    for (const [phone, customerOrders] of Object.entries(grouped)) {
      try {
        const totalDue = customerOrders.reduce((sum, o) => {
          return sum + +(Number(o.total_amount || 0) * 1.18).toFixed(2)
        }, 0)

        const reminderNum = Math.max(...customerOrders.map(o => (o.reminder_count || 0) + 1))
        const urgency = reminderNum === 1 ? '⏰' : reminderNum === 2 ? '🔔' : '❗'

        // Build order list
        const orderLines = customerOrders.map(o => {
          const grand = +(Number(o.total_amount || 0) * 1.18).toFixed(2)
          return `  • INV-${String(o.id).padStart(4, '0')} — ₹${grand.toFixed(2)}`
        }).join('\n')

        // Find the most recent payment link
        const paymentLink = customerOrders.find(o => o.payment_link)?.payment_link

        const msg = [
          `${urgency} *Payment Reminder${reminderNum > 1 ? ` #${reminderNum}` : ''}*`,
          ``,
          `Namaste! You have *${customerOrders.length}* pending invoice${customerOrders.length > 1 ? 's' : ''}:`,
          ``,
          orderLines,
          ``,
          `💰 *Total Due: ₹${totalDue.toFixed(2)}*`,
          ``,
          paymentLink
            ? `💳 *Pay now:*\n${paymentLink}`
            : `Please make your payment at your earliest convenience.`,
          ``,
          reminderNum >= 3
            ? `This is our final reminder. Thank you! — BusinessVaani`
            : `Thank you! 🙏 — BusinessVaani`,
        ].join('\n')

        await sendWhatsApp(phone, msg)

        // Update all orders for this customer
        for (const order of customerOrders) {
          await supabase.from('orders').update({
            last_reminder_at: new Date().toISOString(),
            reminder_count: (order.reminder_count || 0) + 1,
          }).eq('id', order.id)
        }

        sentCount++
        console.log(`Cron: Sent reminder to ${phone} for ${customerOrders.length} order(s)`)
      } catch (e) {
        failCount++
        console.error(`Cron: Failed reminder for ${phone}:`, e.message)
      }
    }

    const summary = `Cron complete: ${sentCount} sent, ${failCount} failed, ${orders.length} orders processed`
    console.log(summary)

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failCount,
      totalOrders: orders.length,
      totalCustomers: Object.keys(grouped).length,
    })
  } catch (err) {
    console.error('Cron: Unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
