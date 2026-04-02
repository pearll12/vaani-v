import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// PUT — update an order (items, total_amount, status, etc.)
export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, items, total_amount, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Order id required' }, { status: 400 })
    }

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

    return NextResponse.json({ success: true, order: data })
  } catch (err) {
    console.error('Order update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
