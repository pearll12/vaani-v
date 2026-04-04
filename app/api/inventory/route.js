import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('createdAt', { ascending: false })
    
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

const KNOWN_KEYS = ['id', 'name', 'sku', 'category', 'quantity', 'unit', 'price', 'lowStockThreshold', 'createdAt', 'updatedAt', 'custom_data']

function extractCustomData(body) {
  const custom = { ...(body.custom_data || {}) }
  for (const k of Object.keys(body)) {
    if (!KNOWN_KEYS.includes(k)) {
      custom[k] = body[k]
    }
  }
  return custom
}

export async function POST(req) {
  try {
    const body = await req.json()
    const custom_data = extractCustomData(body)
    const item = {
      id: body.id || Date.now().toString(),
      name: body.name || 'Unnamed',
      sku: body.sku || `SKU-${Date.now()}`,
      category: body.category || 'General',
      quantity: Number(body.quantity) || 0,
      unit: body.unit || 'pcs',
      price: Number(body.price) || 0,
      lowStockThreshold: Number(body.lowStockThreshold) || 10,
      custom_data
    }
    
    const { data, error } = await supabase
      .from('inventory')
      .upsert([item], { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, name, sku, category, quantity, unit, price, lowStockThreshold, createdAt, updatedAt } = body
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const custom_data = extractCustomData(body)

    const updates = {
      name, sku, category, quantity, unit, price, lowStockThreshold, custom_data
    }

    // Clean undefined fields to avoid overwriting with null accidentally
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key])
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
