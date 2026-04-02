import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: orders = [] } = await supabase
      .from('orders').select('*').order('created_at', { ascending: true })

    const paid     = orders.filter(o => o.status === 'paid')
    const pending  = orders.filter(o => o.status === 'pending')
    const invoiced = orders.filter(o => o.status === 'invoiced')

    const totalRevenue  = paid.reduce((s, o) => s + (o.total_amount || 0), 0)
    const gstCollected  = totalRevenue * 0.18
    const revenueAtRisk = invoiced.reduce((s, o) => s + (o.total_amount || 0), 0)

    const today = new Date().toISOString().split('T')[0]
    const ordersToday = orders.filter(o => o.created_at?.startsWith(today)).length

    // Revenue by day — last 7 days
    const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const revenueByDay = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const val = orders
        .filter(o => o.status === 'paid' && o.created_at?.startsWith(ds))
        .reduce((s, o) => s + (o.total_amount || 0), 0)
      revenueByDay.push({ day: DAYS[d.getDay()], value: val })
    }

    // GST by week — last 4 weeks
    const gstByWeek = []
    for (let i = 3; i >= 0; i--) {
      const end = new Date(); end.setDate(end.getDate() - i * 7)
      const start = new Date(end); start.setDate(start.getDate() - 7)
      const val = orders
        .filter(o => o.status === 'paid' && new Date(o.created_at) >= start && new Date(o.created_at) <= end)
        .reduce((s, o) => s + (o.total_amount || 0), 0)
      gstByWeek.push({ label: `W${4 - i}`, value: +(val * 0.18).toFixed(0) })
    }

    // Top buyers
    const map = {}
    orders.forEach(o => {
      const p = o.customer_phone
      if (!map[p]) map[p] = { phone: p, totalOrders: 0, totalSpent: 0, languages: new Set(), lastOrder: null }
      map[p].totalOrders++
      if (o.status === 'paid') map[p].totalSpent += (o.total_amount || 0)
      if (o.language) map[p].languages.add(o.language)
      if (!map[p].lastOrder || o.created_at > map[p].lastOrder) map[p].lastOrder = o.created_at
    })
    const topBuyers = Object.values(map)
      .sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 5)
      .map(b => ({ ...b, languages: [...b.languages] }))

    return NextResponse.json({
      totalRevenue, gstCollected, revenueAtRisk, ordersToday,
      revenueByDay, gstByWeek,
      statusBreakdown: { pending: pending.length, invoiced: invoiced.length, paid: paid.length },
      topBuyers,
    })
  } catch (err) {
    console.error('Analytics:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
