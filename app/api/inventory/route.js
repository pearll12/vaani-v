import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * GET — Fetch all items from inventory
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Inventory GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST — Upsert inventory item(s) (supports single object or array of objects)
 * DB columns: id (text), name, sku, category, quantity (int), unit, price (numeric),
 *             "lowStockThreshold" (int), "createdAt", custom_data (jsonb)
 */
export async function POST(req) {
  try {
    const body = await req.json()
    const isBatch = Array.isArray(body)
    const items = isBatch ? body : [body]

    // Known DB columns (besides id and createdAt which are auto-managed)
    const KNOWN_KEYS = ['name', 'sku', 'category', 'quantity', 'stock', 'unit', 'price', 'lowStockThreshold']

    const processedItems = items.map(item => {
      if (!item.name && !isBatch) {
        throw new Error('Item name is required')
      }

      // Collect any extra keys into custom_data
      const customData = {}
      Object.keys(item).forEach(key => {
        if (!KNOWN_KEYS.includes(key) && key !== 'id' && key !== 'createdAt' && key !== 'custom_data') {
          if (item[key] !== undefined && item[key] !== '') {
            customData[key] = item[key]
          }
        }
      })
      // Merge with any existing custom_data passed in
      if (item.custom_data && typeof item.custom_data === 'object') {
        Object.assign(customData, item.custom_data)
      }

      const row = {
        ...(item.id ? { id: item.id } : { id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }),
        name: item.name || 'Unnamed Item',
        sku: item.sku || '',
        category: item.category || 'General',
        quantity: Number(item.quantity ?? item.stock ?? 0),
        unit: item.unit || 'pcs',
        price: Number(item.price) || 0,
        lowStockThreshold: Number(item.lowStockThreshold) || 10,
      }

      if (Object.keys(customData).length > 0) {
        row.custom_data = customData
      }

      return row
    }).filter(item => item.name !== 'Unnamed Item' || !isBatch)

    if (processedItems.length === 0) {
      return NextResponse.json({ error: 'No valid items provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('inventory')
      .upsert(processedItems)
      .select()

    if (error) throw error
    
    return NextResponse.json({ 
      success: true, 
      count: data.length,
      items: isBatch ? data : data[0] 
    })
  } catch (err) {
    console.error('Inventory POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE — Remove items (single by ID or multiple via ?clear=true)
 */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const isClear = searchParams.get('clear') === 'true'

    if (isClear) {
      // Wipe the whole inventory (Warning: careful with this in production!)
      const { error } = await supabase
        .from('inventory')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Placeholder for "everything"

      if (error) throw error
      return NextResponse.json({ success: true, message: 'Inventory cleared' })
    }

    // Support id from query params (frontend sends ?id=xxx) or body
    const idFromParams = searchParams.get('id')
    let id = idFromParams
    if (!id) {
      try {
        const body = await req.json()
        id = body.id
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 })
    }

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Item deleted' })
  } catch (err) {
    console.error('Inventory DELETE error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}