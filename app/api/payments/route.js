import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { assignDeliveryAgent } from '@/lib/delivery'
import { sendWhatsApp } from '@/lib/twilio'

export async function GET() {
  try {
    const { data: orders = [], error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return NextResponse.json(orders)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { orderId, status = 'paid' } = await req.json()

    // Fetch existing order to check for cancelled → paid restoration scenario
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    const { error } = await supabase
      .from('orders').update({ status }).eq('id', orderId)
    if (error) throw error

    // If a cancelled order is being re-activated (e.g. cancelled → paid)
    // deduct inventory again since it was restored on cancellation
    if (existingOrder && existingOrder.status === 'cancelled' && status !== 'cancelled') {
      const items = existingOrder.items || []
      const { data: inventory } = await supabase.from('inventory').select('*')
      if (inventory) {
        for (const item of items) {
          if (!item.inventoryId) continue
          const inv = inventory.find(i => i.id === item.inventoryId)
          if (!inv) continue
          const qty = Number(item.quantity) || 1
          const newQty = Math.max(0, Number(inv.quantity) - qty)
          await supabase.from('inventory').update({ quantity: newQty }).eq('id', inv.id)
        }
        console.log(`📦 Inventory re-deducted for reactivated order #${orderId}`)
      }
    }

    // NEW — Trigger delivery assignment if status changed to 'paid'
    if (status === 'paid' && existingOrder && existingOrder.status !== 'paid') {
      if (existingOrder.address) {
        try {
          console.log(`🚚 (Manual) Payment confirmed for Order #${orderId}. Assigning delivery partner...`)
          const agent = await assignDeliveryAgent(orderId)
          if (agent) {
             await sendWhatsApp(existingOrder.customer_phone, [
              `✅ *Payment Confirmed!* (Manual update)`,
              ``,
              `We've received your payment for order INV-${String(orderId).padStart(4, '0')}.`,
              ``,
              `✅ Delivery partner *${agent.name}* has been assigned!`,
              `📞 Contact: ${agent.phone}`,
              ``,
              `🛵 *Track order:* Reply "track ${orderId}" for updates.`,
              ``,
              `Thank you! 🙏 — BusinessVaani`,
            ].join('\n'))
          }
        } catch (err) {
          console.error(`❌ (Manual) Delivery assignment failed for Order #${orderId}:`, err)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
