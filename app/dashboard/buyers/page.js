'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const LANG_COLOR = {
  tamil: '#f97316', marathi: '#a855f7', telugu: '#3b9eff',
  hindi: '#22c55e', hinglish: '#eab308', english: '#94a3b8',
}

const AVATAR_COLORS = [
  ['#00d68f', '#3b9eff'], ['#7c6df8', '#f4607b'], ['#f5a623', '#22c55e'],
  ['#3b9eff', '#7c6df8'], ['#f4607b', '#f5a623'],
]

function Avatar({ phone, idx, size = 42 }) {
  const [c1, c2] = AVATAR_COLORS[idx % AVATAR_COLORS.length]
  const initials = phone?.slice(-2) || '??'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 800, color: '#fff',
      boxShadow: `0 2px 12px ${c1}30`,
    }}>
      {initials}
    </div>
  )
}

function LangTag({ lang }) {
  const color = LANG_COLOR[lang] || '#94a3b8'
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 5,
      background: `${color}18`, color, border: `1px solid ${color}28`,
      fontWeight: 700, letterSpacing: '0.03em', textTransform: 'capitalize',
    }}>{lang}</span>
  )
}

function PodiumCard({ buyer, rank, podiumIdx }) {
  const medals = ['🥇', '🥈', '🥉']
  const heights = [170, 200, 150]
  const [c1] = AVATAR_COLORS[rank % AVATAR_COLORS.length]
  const isTop = rank === 0
  return (
    <div style={{
      background: 'var(--card)',
      border: `1px solid ${isTop ? 'rgba(0,214,143,0.25)' : 'var(--border)'}`,
      borderRadius: 16, padding: 20, textAlign: 'center',
      height: heights[podiumIdx], display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      boxShadow: isTop ? '0 0 32px rgba(0,214,143,0.1)' : 'none',
      transition: 'transform 0.2s', cursor: 'default',
      position: 'relative', overflow: 'hidden',
    }}>
      {isTop && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0,214,143,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
      )}
      <span style={{ fontSize: 20, marginBottom: 8 }}>{medals[rank]}</span>
      <Avatar phone={buyer.phone} idx={rank} size={isTop ? 52 : 42} />
      <p style={{ margin: '10px 0 3px', fontWeight: 700, fontSize: 12.5, color: '#d4e0ee' }}>
        {buyer.phone}
      </p>
      <p style={{ margin: 0, fontSize: isTop ? 18 : 15, fontWeight: 800, color: isTop ? 'var(--emerald)' : '#94a3b8', letterSpacing: '-0.01em' }}>
        ₹{buyer.totalSpent.toLocaleString('en-IN')}
      </p>
      <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--muted)' }}>{buyer.totalOrders} orders</p>
    </div>
  )
}

export default function BuyersPage() {
  const [buyers, setBuyers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort]       = useState('orders')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: orders = [] } = await supabase.from('orders').select('*')
    const map = {}
    orders.forEach(o => {
      const p = o.customer_phone
      if (!map[p]) map[p] = { phone: p, totalOrders: 0, totalSpent: 0, languages: new Set(), firstOrder: o.created_at, lastOrder: o.created_at }
      map[p].totalOrders++
      if (o.status === 'paid') map[p].totalSpent += (o.total_amount || 0)
      if (o.language) map[p].languages.add(o.language)
      if (o.created_at < map[p].firstOrder) map[p].firstOrder = o.created_at
      if (o.created_at > map[p].lastOrder)  map[p].lastOrder  = o.created_at
    })
    const arr = Object.values(map).map(b => ({
      ...b,
      languages: [...b.languages],
      avgOrder: b.totalOrders > 0 ? +(b.totalSpent / b.totalOrders).toFixed(0) : 0,
    }))
    setBuyers(arr)
    setLoading(false)
  }

  const sorted = [...buyers].sort((a, b) =>
    sort === 'orders' ? b.totalOrders - a.totalOrders :
    sort === 'spent'  ? b.totalSpent  - a.totalSpent  :
                        b.avgOrder    - a.avgOrder
  )

  const totalRevenue = buyers.reduce((s, b) => s + b.totalSpent, 0)
  const totalOrders  = buyers.reduce((s, b) => s + b.totalOrders, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Buyers</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0', fontWeight: 500 }}>
            {buyers.length} customers · ₹{totalRevenue.toLocaleString('en-IN')} revenue · {totalOrders} orders total
          </p>
        </div>
        {/* Sort controls */}
        <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {[['orders', 'By Orders'], ['spent', 'By Spend'], ['avg', 'By Avg']].map(([key, label]) => (
            <button key={key} onClick={() => setSort(key)} style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: sort === key ? 'var(--emerald)' : 'transparent',
              color: sort === key ? '#020f0a' : 'var(--muted)',
              transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Podium */}
      {!loading && sorted.length >= 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, alignItems: 'flex-end' }}>
          {[sorted[1], sorted[0], sorted[2]].map((b, podiumIdx) => {
            const rank = podiumIdx === 1 ? 0 : podiumIdx === 0 ? 1 : 2
            return <PodiumCard key={b.phone} buyer={b} rank={rank} podiumIdx={podiumIdx} />
          })}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>◉</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted-light)', margin: 0 }}>No buyers yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="bv-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Languages</th>
                  <th style={{ textAlign: 'right' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Total Spent</th>
                  <th style={{ textAlign: 'right' }}>Avg Order</th>
                  <th>Last Order</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((b, i) => {
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <tr key={b.phone}>
                      <td>
                        <span style={{ fontSize: i < 3 ? 18 : 13, fontWeight: 700, color: i < 3 ? undefined : 'var(--muted)' }}>
                          {medals[i] || `#${i + 1}`}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar phone={b.phone} idx={i} size={36} />
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: '#d4e0ee' }}>{b.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {b.languages.map(l => <LangTag key={l} lang={l} />)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontWeight: 700, color: '#e8edf5' }}>{b.totalOrders}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontWeight: 700, color: 'var(--emerald)' }}>₹{b.totalSpent.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>₹{b.avgOrder.toLocaleString('en-IN')}</td>
                      <td style={{ fontSize: 12.5, color: 'var(--muted-light)' }}>
                        {b.lastOrder ? new Date(b.lastOrder).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <a
                          href={`https://wa.me/${b.phone.replace(/\D/g, '')}`}
                          target="_blank" rel="noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'var(--emerald-dim)', color: 'var(--emerald)',
                            border: '1px solid var(--emerald-border)',
                            padding: '6px 14px', borderRadius: 8,
                            fontSize: 12.5, textDecoration: 'none', fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,214,143,0.14)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--emerald-dim)' }}
                        >
                          💬 WhatsApp
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
