import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const daysParam = parseInt(searchParams.get('days')) || 7

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

    // Revenue by period
    const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const revenueByDay = []

    if (daysParam <= 30) {
      // Daily data
      for (let i = daysParam - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const ds = d.toISOString().split('T')[0]
        const val = orders
          .filter(o => o.status === 'paid' && o.created_at?.startsWith(ds))
          .reduce((s, o) => s + (o.total_amount || 0), 0)
        
        let label = DAYS_SHORT[d.getDay()]
        if (daysParam > 7) label = `${d.getDate()} ${MONTHS[d.getMonth()]}`
        revenueByDay.push({ day: label, value: val })
      }
    } else if (daysParam <= 90) {
      // Weekly data (last 12-13 weeks)
      for (let i = 12; i >= 0; i--) {
        const end = new Date(); end.setDate(end.getDate() - i * 7)
        const start = new Date(end); start.setDate(start.getDate() - 7)
        const val = orders
          .filter(o => o.status === 'paid' && new Date(o.created_at) >= start && new Date(o.created_at) <= end)
          .reduce((s, o) => s + (o.total_amount || 0), 0)
        revenueByDay.push({ day: `W${13 - i}`, value: val })
      }
    } else {
      // Monthly data (last 12 months)
      for (let i = 11; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1)
        const m = d.getMonth()
        const y = d.getFullYear()
        const val = orders
          .filter(o => {
            const od = new Date(o.created_at)
            return o.status === 'paid' && od.getMonth() === m && od.getFullYear() === y
          })
          .reduce((s, o) => s + (o.total_amount || 0), 0)
        revenueByDay.push({ day: MONTHS[m], value: val })
      }
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

    // Low Stock Items (top 5)
    // We fetch inventory separately because it's a different table
    const { data: inventory = [] } = await supabase.from('inventory').select('*')
    const lowStockItems = inventory
      .filter(i => Number(i.quantity) <= Number(i.lowStockThreshold))
      .sort((a, b) => Number(a.quantity) - Number(b.quantity))
      .slice(0, 5)

    // Latest Purchases (paid orders)
    const latestPaidOrders = paid
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)

    // Latest Orders (pending or invoiced)
    const latestOrders = orders
      .filter(o => o.status === 'pending' || o.status === 'invoiced')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)

    return NextResponse.json({
      totalRevenue, gstCollected, revenueAtRisk, ordersToday,
      revenueByDay, gstByWeek,
      statusBreakdown: { pending: pending.length, invoiced: invoiced.length, paid: paid.length },
      lowStockItems, latestPaidOrders, latestOrders
    })
  } catch (err) {
    console.error('Analytics:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}