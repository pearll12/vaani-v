import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import crypto from 'crypto'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// ─── Helper: Mark orders as paid + send confirmation ───
async function markOrdersPaid(orderIds, amount, paymentId, customerPhone) {
  const now = new Date().toISOString()

  for (const oid of orderIds) {
    await supabase.from('orders').update({
      status: 'paid',
      paid_at: now,
      razorpay_payment_id: paymentId,
    }).eq('id', oid).neq('status', 'paid')
  }

  console.log(`✅ Marked ${orderIds.length} orders as paid: [${orderIds.join(', ')}]`)

  // Send confirmation WhatsApp
  if (customerPhone) {
    const isConsolidated = orderIds.length > 1
    const msg = isConsolidated
      ? [
          `✅ *Payment Confirmed!*`,
          ``,
          `We've received your full payment of *₹${amount}*.`,
          ``,
          `📋 ${orderIds.length} orders cleared:`,
          ...orderIds.map(id => `  ✓ INV-${String(id).padStart(4, '0')}`),
          ``,
          `🆔 Payment ID: ${paymentId || 'N/A'}`,
          ``,
          `All dues are now settled. Thank you! 🙏`,
          `— BusinessVaani`,
        ].join('\n')
      : [
          `✅ *Payment Confirmed!*`,
          ``,
          `We've received your payment of *₹${amount}*.`,
          ``,
          `📋 Order: INV-${String(orderIds[0]).padStart(4, '0')}`,
          `🆔 Payment ID: ${paymentId || 'N/A'}`,
          ``,
          `Your order will be processed soon. Thank you! 🙏`,
          `— BusinessVaani`,
        ].join('\n')

    try {
      await sendWhatsApp(customerPhone, msg)
      console.log(`📱 Confirmation sent to ${customerPhone}`)
    } catch (e) {
      console.error('WhatsApp confirmation failed:', e.message)
    }
  }
}

// ─── POST: Razorpay Webhook (automatic) ───
export async function POST(req) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    // Verify webhook signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (secret && signature) {
      const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
      if (expected !== signature) {
        console.error('❌ Invalid Razorpay webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(body)
    console.log('🔔 Razorpay webhook:', event.event)

    if (event.event === 'payment_link.paid') {
      const payload = event.payload?.payment_link?.entity
      const notes = payload?.notes || {}
      const amount = payload?.amount ? (payload.amount / 100).toFixed(2) : null
      const paymentId = payload?.id

      // ─── CONSOLIDATED KHATA PAYMENT ───
      if (notes.type === 'khata_consolidated' && notes.order_ids) {
        const orderIds = notes.order_ids.split(',').map(id => id.trim()).filter(Boolean)
        const customerPhone = notes.customer_phone

        console.log(`💰 Consolidated khata payment: ${orderIds.length} orders, ₹${amount}`)

        // Anti-duplicate: check if all already paid
        const { data: existingOrders = [] } = await supabase
          .from('orders').select('id, status').in('id', orderIds)
        if (existingOrders.length > 0 && existingOrders.every(o => o.status === 'paid')) {
          console.log('⏭ All orders already paid. Skipping duplicate.')
          return NextResponse.json({ ok: true, skipped: true })
        }

        await markOrdersPaid(orderIds, amount, paymentId, customerPhone)
        return NextResponse.json({ ok: true, consolidated: true, orderIds })
      }

      // ─── SINGLE ORDER PAYMENT ───
      const orderId = notes.order_id
      if (orderId) {
        const { data: order } = await supabase
          .from('orders').select('*').eq('id', orderId).single()

        if (order?.status === 'paid') {
          console.log(`⏭ Order ${orderId} already paid. Skipping.`)
          return NextResponse.json({ ok: true, skipped: true })
        }

        await markOrdersPaid(
          [orderId],
          amount || (order ? (Number(order.total_amount) * 1.18).toFixed(2) : null),
          paymentId,
          order?.customer_phone
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('❌ Webhook POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── GET: Razorpay Callback Redirect (after customer pays) ───
// This is the FALLBACK — when customer is redirected after payment,
// we verify the payment via Razorpay API and mark orders as paid.
// This works even if the webhook POST doesn't fire.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const paymentLinkId = searchParams.get('razorpay_payment_link_id')
    const paymentId = searchParams.get('razorpay_payment_id')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''

    console.log(`🔄 Razorpay callback: plink=${paymentLinkId}, payment=${paymentId}`)

    if (paymentLinkId) {
      try {
        // Fetch payment link details from Razorpay API
        const plinkDetails = await razorpay.paymentLink.fetch(paymentLinkId)
        console.log('📋 Payment link status:', plinkDetails.status, 'Notes:', JSON.stringify(plinkDetails.notes))

        if (plinkDetails.status === 'paid') {
          const notes = plinkDetails.notes || {}
          const amount = plinkDetails.amount ? (plinkDetails.amount / 100).toFixed(2) : null

          // ─── CONSOLIDATED KHATA PAYMENT ───
          if (notes.type === 'khata_consolidated' && notes.order_ids) {
            const orderIds = notes.order_ids.split(',').map(id => id.trim()).filter(Boolean)
            const customerPhone = notes.customer_phone

            // Check if already processed
            const { data: existingOrders = [] } = await supabase
              .from('orders').select('id, status').in('id', orderIds)
            const allPaid = existingOrders.length > 0 && existingOrders.every(o => o.status === 'paid')

            if (!allPaid) {
              await markOrdersPaid(orderIds, amount, paymentId || paymentLinkId, customerPhone)
            }

            return NextResponse.redirect(`${baseUrl}/dashboard/payments?paid=consolidated`)
          }

          // ─── SINGLE ORDER PAYMENT ───
          const orderId = notes.order_id
          if (orderId) {
            const { data: order } = await supabase
              .from('orders').select('*').eq('id', orderId).single()

            if (order && order.status !== 'paid') {
              await markOrdersPaid(
                [orderId],
                amount || (Number(order.total_amount) * 1.18).toFixed(2),
                paymentId || paymentLinkId,
                order.customer_phone
              )
            }

            return NextResponse.redirect(`${baseUrl}/dashboard/payments?paid=${orderId}`)
          }
        }
      } catch (apiErr) {
        console.error('❌ Razorpay API fetch error:', apiErr.message)
      }
    }

    // Fallback: redirect with whatever info we have
    const orderId = searchParams.get('order_id') || searchParams.get('razorpay_order_id')
    return NextResponse.redirect(`${baseUrl}/dashboard/payments?paid=${orderId || 'unknown'}`)
  } catch (err) {
    console.error('❌ Webhook GET error:', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard/payments`)
  }
}
