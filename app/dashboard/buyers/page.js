'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const parseUtc = (ds) => !ds ? null : new Date(typeof ds === 'string' && !ds.endsWith('Z') && !ds.includes('+') ? ds + 'Z' : ds)


const LANG_COLOR = {
  tamil: '#f97316', marathi: '#a855f7', telugu: '#3b9eff',
  hindi: '#22c55e', hinglish: '#eab308', english: 'var(--muted-light)',
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
  const color = LANG_COLOR[lang] || 'var(--muted-light)'
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
      <p style={{ margin: '10px 0 3px', fontWeight: 700, fontSize: 11.5, color: '#d4e0ee', wordBreak: 'break-all', textAlign: 'center', lineHeight: 1.2 }}>
        {buyer.phone}
      </p>
      <p style={{ margin: 0, fontSize: isTop ? 16 : 14, fontWeight: 800, color: isTop ? 'var(--teal)' : 'var(--muted)', letterSpacing: '-0.01em', textAlign: 'center' }}>
        ₹{buyer.totalSpent.toLocaleString('en-IN')}
      </p>
      <p style={{ margin: '3px 0 0', fontSize: 10.5, color: 'var(--muted)' }}>{buyer.totalOrders} orders</p>
    </div>
  )
}

export default function BuyersPage() {
  const [buyers, setBuyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('orders')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => { load() }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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
      if (o.created_at > map[p].lastOrder) map[p].lastOrder = o.created_at
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
      sort === 'spent' ? b.totalSpent - a.totalSpent :
        b.avgOrder - a.avgOrder
  )

  const totalRevenue = buyers.reduce((s, b) => s + b.totalSpent, 0)
  const totalOrders = buyers.reduce((s, b) => s + b.totalOrders, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60 }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Buyers</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0', fontWeight: 500 }}>
            {buyers.length} customers <span className="mobile-hide">· ₹{totalRevenue.toLocaleString('en-IN')} revenue · {totalOrders} orders total</span>
          </p>
        </div>

        {/* Sort controls */}
        <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {[['orders', 'Orders'], ['spent', 'Spend'], ['avg', 'Avg']].map(([key, label]) => (
            <button key={key} onClick={() => setSort(key)} style={{
              padding: isMobile ? '8px 12px' : '8px 16px', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              background: sort === key ? 'var(--emerald)' : 'transparent',
              color: sort === key ? '#020f0a' : 'var(--muted)',
              transition: 'all 0.15s', fontFamily: 'Plus Jakarta Sans, sans-serif',
              textTransform: 'uppercase', letterSpacing: '0.02em'
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Podium */}
      {!loading && sorted.length >= 3 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: isMobile ? 6 : 14,
          alignItems: 'flex-end',
          overflowX: 'visible',
          paddingTop: 0,
          paddingLeft: 0,
          paddingRight: 0,
          paddingBottom: isMobile ? 8 : 0,
          margin: 0,
          // padding: 0,
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
          {[sorted[1], sorted[0], sorted[2]].map((b, podiumIdx) => {
            const rank = podiumIdx === 1 ? 0 : podiumIdx === 0 ? 1 : 2
            return <PodiumCard key={b.phone} buyer={b} rank={rank} podiumIdx={podiumIdx} />
          })}
        </div>
      )}

      {/* Main List */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>◉</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted-light)', margin: 0 }}>No buyers yet</p>
          </div>
        ) : isMobile ? (
          /* Mobile Card List */
          <div className="card-list-mobile">
            {sorted.map((b, i) => {
              const medals = ['🥇', '🥈', '🥉']
              return (
                <div key={b.phone} className="mobile-card" style={{
                  background: i < 3 ? 'rgba(255,255,255,0.02)' : 'var(--card)',
                  border: i < 3 ? `1px solid ${i === 0 ? 'var(--emerald)' : 'var(--border-strong)'}` : '1px solid var(--border)',
                  padding: 14
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar phone={b.phone} idx={i} size={32} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                          {medals[i] || `#${i + 1}`} {b.phone}
                        </p>
                        <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                          {b.languages.slice(0, 2).map(l => <LangTag key={l} lang={l} />)}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--emerald)', fontFamily: 'JetBrains Mono, monospace' }}>
                        ₹{b.totalSpent.toLocaleString('en-IN')}
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{b.totalOrders} orders</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, color: 'var(--muted-light)' }}>
                      Avg: ₹{b.avgOrder.toLocaleString('en-IN')}
                    </span>
                    <a
                      href={`https://wa.me/${b.phone.replace(/\D/g, '')}`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, color: 'var(--emerald)', textDecoration: 'none', fontWeight: 700 }}
                    >
                      💬 Message
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Desktop Table */
          <div className="desktop-only" style={{ overflowX: 'auto' }}>
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
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>{b.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {b.languages.map(l => <LangTag key={l} lang={l} />)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontWeight: 700, color: 'var(--muted)' }}>{b.totalOrders}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontWeight: 700, color: 'var(--emerald)' }}>₹{b.totalSpent.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>₹{b.avgOrder.toLocaleString('en-IN')}</td>
                      <td style={{ fontSize: 12.5, color: 'var(--muted-light)' }}>
                        {b.lastOrder ? parseUtc(b.lastOrder).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <a
                          href={`https://wa.me/${b.phone.replace(/\D/g, '')}`}
                          target="_blank" rel="noreferrer"
                          className="btn-ghost"
                          style={{ fontSize: 11, padding: '6px 12px' }}
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
