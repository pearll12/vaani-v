import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const daysParam = parseInt(searchParams.get('days')) || 7

    const { data: orders = [], error: dbError } = await supabase
      .from('orders').select('*').order('created_at', { ascending: true })
    
    if (dbError) {
      console.warn('Database warning:', dbError)
      return NextResponse.json({
        totalRevenue: 0, gstCollected: 0, revenueAtRisk: 0, ordersToday: 0,
        revenueByDay: [], gstByWeek: [],
        statusBreakdown: { pending: 0, invoiced: 0, paid: 0 },
        topBuyers: [],
      })
    }

    // ═══ Order Status Breakdown ═══
    const paid     = orders.filter(o => o.status === 'paid')
    const pending  = orders.filter(o => o.status === 'pending')
    const invoiced = orders.filter(o => o.status === 'invoiced')

    // ═══ Revenue Calculations ═══
    const totalRevenue  = paid.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0)
    const gstCollected  = totalRevenue * 0.18
    const revenueAtRisk = (invoiced.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0)) + 
                          (pending.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0))

    // ═══ Today's Orders ═══
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