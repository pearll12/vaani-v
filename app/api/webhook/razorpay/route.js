import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import crypto from 'crypto'


export async function POST(req) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    // Verify webhook signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (secret) {
      const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
      if (expected !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(body)
    console.log('Razorpay webhook:', event.event)

    if (event.event === 'payment_link.paid' || event.event === 'payment.captured') {
      const payload = event.payload?.payment_link?.entity || event.payload?.payment?.entity
      const orderId = payload?.notes?.order_id
      const amount = payload?.amount ? (payload.amount / 100).toFixed(2) : null
      const paymentId = payload?.id

      if (orderId) {
        // Fetch order first to check current status
        const { data: order } = await supabase
          .from('orders').select('*').eq('id', orderId).single()

        // 🛑 Anti-Duplicate Check: If already paid, DO NOT send another message!
        if (order?.status === 'paid') {
          console.log(`Order ${orderId} already paid. Skipping duplicate message.`)
          return NextResponse.json({ ok: true, skipped: true })
        }

        // Update order status
        await supabase.from('orders').update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          razorpay_payment_id: paymentId,
        }).eq('id', orderId)

        if (order?.customer_phone) {
          await sendWhatsApp(order.customer_phone, [
            `✅ *Payment Confirmed!*`,
            ``,
            `We've received your payment of *₹${amount || Number(order.total_amount * 1.18).toFixed(2)}*.`,
            ``,
            `📋 Order: INV-${String(orderId).padStart(4, '0')}`,
            `🆔 Payment ID: ${paymentId || 'N/A'}`,
            ``,
            `Your order will be processed soon. Thank you! 🙏`,
            `— BusinessVaani`,
          ].join('\n'))
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Razorpay GET callback redirect after payment
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('order_id') || searchParams.get('razorpay_order_id')
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard/payments?paid=${orderId}`)
}
