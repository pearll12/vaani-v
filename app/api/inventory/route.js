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
 */
export async function POST(req) {
  try {
    const body = await req.json()
    const isBatch = Array.isArray(body)
    const items = isBatch ? body : [body]

    const processedItems = items.map(item => {
      const { id, name, price, stock, quantity, description, image_url, category } = item
      
      if (!name && !isBatch) {
        throw new Error('Item name is required')
      }

      return {
        ...(id ? { id } : {}),
        name: name || 'Unnamed Item',
        price: Number(price) || 0,
        // Support both 'stock' and 'quantity' from frontend
        stock: Number(stock ?? quantity ?? 0),
        description: description || '',
        image_url: image_url || '',
        category: category || 'General',
        updated_at: new Date().toISOString()
      }
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

    const body = await req.json()
    const { id } = body

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