import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'

// GET — Derive khata (credit ledger) from orders table
// NO extra tables needed — calculates per-customer balance from orders
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
          balance: 0,  // outstanding (unpaid)
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
        c.balance += grand  // unpaid = udhaar
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
      .sort((a, b) => b.balance - a.balance) // highest udhaar first

    return NextResponse.json(khata)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — Send settlement reminder via WhatsApp
export async function POST(req) {
  try {
    const { phone, action } = await req.json()

    if (action === 'settle_reminder') {
      // Calculate balance on-the-fly from orders
      const { data: orders = [] } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', phone)
        .neq('status', 'paid')

      const balance = orders.reduce((s, o) => {
        const amt = Number(o.total_amount) || 0
        return s + +(amt * 1.18).toFixed(2)
      }, 0)

      if (balance <= 0) {
        return NextResponse.json({ error: 'No pending balance' }, { status: 400 })
      }

      // Build order list for reminder
      const orderList = orders.slice(0, 5).map(o =>
        `  • #${String(o.id).padStart(4, '0')} — ₹${(+(Number(o.total_amount || 0) * 1.18).toFixed(2))}`
      ).join('\n')

      const msg = [
        `💰 *Udhaar Reminder — BusinessVaani*`,
        ``,
        `Namaste! Aapke kuch pending payments hain:`,
        ``,
        orderList,
        ``,
        `📊 *Total Due:* ₹${balance.toFixed(2)}`,
        ``,
        orders[0]?.payment_link
          ? `💳 *Pay now:* ${orders[0].payment_link}`
          : `Kripya jald se jald payment kar dein.`,
        ``,
        `Thank you! 🙏 — BusinessVaani`,
      ].join('\n')

      await sendWhatsApp(phone, msg)

      return NextResponse.json({ success: true, balance })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
