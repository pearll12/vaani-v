import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// GET — Derive khata (credit ledger) from orders table
export async function GET() {
  try {
    const { data: orders = [] } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    // Group by customer phone → calculate balance
    const customerMap = {}
    for (const o of orders) {
      const phone = o.customer_phone || 'unknown'
      if (!customerMap[phone]) {
        customerMap[phone] = {
          customer_phone: phone,
          total_orders: 0,
          total_amount: 0,
          total_paid: 0,
          balance: 0,
          orders: [],
          last_order_date: null,
        }
      }
      const c = customerMap[phone]
      const amt = Number(o.total_amount) || 0
      const gst = +(amt * 0.18).toFixed(2)
      const grand = +(amt + gst).toFixed(2)

      c.total_orders++
      c.total_amount += grand

      if (o.status === 'paid') {
        c.total_paid += grand
      } else {
        c.balance += grand
      }

      c.orders.push({
        id: o.id,
        items: o.items || [],
        total_amount: amt,
        grand_total: grand,
        status: o.status,
        created_at: o.created_at,
      })

      if (!c.last_order_date || new Date(o.created_at) > new Date(c.last_order_date)) {
        c.last_order_date = o.created_at
      }
    }

    const khata = Object.values(customerMap)
      .map(c => ({ ...c, balance: +(c.balance).toFixed(2), total_amount: +(c.total_amount).toFixed(2), total_paid: +(c.total_paid).toFixed(2) }))
      .sort((a, b) => b.balance - a.balance)

    return NextResponse.json(khata)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — Send settlement reminder via WhatsApp with consolidated Razorpay link
export async function POST(req) {
  try {
    const { phone, action } = await req.json()

    if (action === 'settle_reminder') {
      // Get all unpaid orders for this customer
      const { data: orders = [] } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', phone)
        .neq('status', 'paid')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

      const balance = orders.reduce((s, o) => {
        const amt = Number(o.total_amount) || 0
        return s + +(amt * 1.18).toFixed(2)
      }, 0)

      if (balance <= 0) {
        return NextResponse.json({ error: 'No pending balance' }, { status: 400 })
      }

      // Normalize phone
      const contactPhone = phone.startsWith('+') ? phone : `+91${phone}`

      // Collect all unpaid order IDs
      const orderIds = orders.map(o => String(o.id))

      // Create a CONSOLIDATED Razorpay payment link for total balance
      let paymentLink = null
      try {
        const link = await razorpay.paymentLink.create({
          amount: Math.round(balance * 100),
          currency: 'INR',
          accept_partial: false,
          description: `Outstanding Balance — ${orderIds.length} order${orderIds.length > 1 ? 's' : ''}`,
          customer: { contact: contactPhone },
          notify: { sms: false, email: false },
          reminder_enable: false,
          callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/razorpay`,
          callback_method: 'get',
          notes: {
            type: 'khata_consolidated',
            order_ids: orderIds.join(','),
            customer_phone: phone,
          },
        })
        paymentLink = link.short_url
      } catch (err) {
        console.error('Razorpay consolidated link error:', err.message)
      }

      // Build order summary text (show individual orders with amounts)
      const orderList = orders.slice(0, 8).map(o => {
        const grand = +(Number(o.total_amount || 0) * 1.18).toFixed(2)
        const items = (o.items || []).map(i => `${i.quantity || 1}× ${i.name}`).join(', ')
        const date = new Date(o.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })
        return `  📦 #${String(o.id).padStart(4, '0')} — ₹${grand} (${date})\n     ${items || 'Items N/A'}`
      }).join('\n\n')

      const msg = [
        `💰 *Udhaar Reminder — BusinessVaani*`,
        ``,
        `Namaste! Aapke kuch pending payments hain:`,
        ``,
        orderList,
        ``,
        `━━━━━━━━━━━━━━━━`,
        `📊 *Total Due:* ₹${balance.toFixed(2)}`,
        orders.length > 8 ? `  _(+${orders.length - 8} more orders)_` : '',
        ``,
        paymentLink
          ? `💳 *Pay All Now:* ${paymentLink}`
          : `Kripya jald se jald payment kar dein.`,
        ``,
        `Thank you! 🙏 — BusinessVaani`,
      ].filter(Boolean).join('\n')

      // Send as text only — no PDF attachment for khata reminders
      await sendWhatsApp(phone, msg)

      return NextResponse.json({ success: true, balance, paymentLink })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
