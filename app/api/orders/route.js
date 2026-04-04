import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ───── Inventory Helpers ─────

async function loadInventory() {
  const { data } = await supabase.from('inventory').select('*')
  return data || []
}

async function deductInventory(items) {
  const inventory = await loadInventory()
  const updates = []

  const orderItems = Array.isArray(items) ? items : []
  orderItems.forEach(item => {
    if (!item.inventoryId) return
    const inv = inventory.find(i => i.id === item.inventoryId)
    if (!inv) return

    const qty = Number(item.quantity) || 1
    const currentQty = Number(inv.quantity) || 0
    const newQty = Math.max(0, currentQty - qty)

    updates.push({ id: inv.id, quantity: newQty })
  })

  for (const u of updates) {
    await supabase.from('inventory').update({ quantity: u.quantity }).eq('id', u.id)
  }

  return updates
}

async function restoreInventory(items) {
  const inventory = await loadInventory()
  const updates = []

  const orderItems = Array.isArray(items) ? items : []
  orderItems.forEach(item => {
    if (!item.inventoryId) return
    const inv = inventory.find(i => i.id === item.inventoryId)
    if (!inv) return

    const qty = Number(item.quantity) || 1
    const currentQty = Number(inv.quantity) || 0

    updates.push({ id: inv.id, quantity: currentQty + qty })
  })

  for (const u of updates) {
    await supabase.from('inventory').update({ quantity: u.quantity }).eq('id', u.id)
  }

  return updates
}

// PUT — update an order (items, total_amount, status, etc.)
export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, items, total_amount, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Order id required' }, { status: 400 })
    }

    // Fetch existing order to check status transitions
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    const updates = {}
    if (items !== undefined) updates.items = items
    if (total_amount !== undefined) updates.total_amount = total_amount
    if (status !== undefined) updates.status = status

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ═══ Inventory adjustments based on status changes ═══
    if (existingOrder && status) {
      const oldStatus = existingOrder.status
      const newStatus = status
      const orderItems = data.items || existingOrder.items || []

      // If order is being cancelled → restore inventory
      if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        await restoreInventory(orderItems)
        console.log(`📦 Inventory restored for cancelled order #${id}`)
      }

      // If items were edited on a pending order, recalculate inventory diff
      if (oldStatus === 'pending' && newStatus === undefined && items) {
        // Restore old quantities
        await restoreInventory(existingOrder.items || [])
        // Deduct new quantities
        await deductInventory(items)
        console.log(`📦 Inventory recalculated for edited order #${id}`)
      }
    }

    return NextResponse.json({ success: true, order: data })
  } catch (err) {
    console.error('Order update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
