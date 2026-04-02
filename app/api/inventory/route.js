import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'inventory.json')

function read() {
  if (!fs.existsSync(FILE)) {
    fs.mkdirSync(path.dirname(FILE), { recursive: true })
    fs.writeFileSync(FILE, '[]')
    return []
  }
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
}

function write(items) {
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2))
}

export async function GET() {
  return NextResponse.json(read())
}

export async function POST(req) {
  const body = await req.json()
  const items = read()
  const item = {
    id: Date.now().toString(),
    name: body.name || 'Unnamed',
    sku: body.sku || `SKU-${Date.now()}`,
    category: body.category || 'General',
    quantity: Number(body.quantity) || 0,
    unit: body.unit || 'pcs',
    price: Number(body.price) || 0,
    lowStockThreshold: Number(body.lowStockThreshold) || 10,
    createdAt: new Date().toISOString(),
  }
  items.push(item)
  write(items)
  return NextResponse.json(item)
}

export async function PUT(req) {
  const body = await req.json()
  const items = read()
  const idx = items.findIndex(i => i.id === body.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  items[idx] = { ...items[idx], ...body }
  write(items)
  return NextResponse.json(items[idx])
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const items = read().filter(i => i.id !== id)
  write(items)
  return NextResponse.json({ success: true })
}
