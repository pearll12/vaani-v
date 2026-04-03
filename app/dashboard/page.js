'use client'
import { useEffect, useState } from 'react'
import inventory from '@/data/inventory.json'

function StatCard({ label, value, sub, icon, color, borderColor, bg }) {
  return (
    <div style={{
      background: bg || 'var(--card)', border: `1px solid ${borderColor || 'var(--border)'}`,
      borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden',
    }} className="animate-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <p style={{ fontSize: 10.5, color: color || 'var(--muted)', opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{label}</p>
        <span style={{ fontSize: 18, opacity: 0.85 }}>{icon}</span>
      </div>
      <p style={{ fontSize: 27, fontWeight: 800, color: color || '#fff', margin: 0, letterSpacing: '-0.03em' }}>{value}</p>
      <p style={{ fontSize: 12, color: color ? `${color}99` : 'var(--muted)', marginTop: 5, marginBottom: 0, fontWeight: 500 }}>{sub}</p>
    </div>
  )
}

function AreaChart({ data = [], color = '#00d68f', id = 'a' }) {
  if (data.length < 2) return (
    <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
      No data yet
    </div>
  )
  const W = 500, H = 140, pl = 50, pr = 12, pt = 10, pb = 28
  const cW = W - pl - pr, cH = H - pt - pb
  const max = Math.max(...data.map(d => d.value), 1)
  const pts = data.map((d, i) => ({ x: pl + (i / (data.length - 1)) * cW, y: pt + (1 - d.value / max) * cH, ...d }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts.at(-1).x},${pt + cH} L${pts[0].x},${pt + cH}Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 0.33, 0.66, 1].map(p => (
        <line key={p} x1={pl} y1={pt + (1 - p) * cH} x2={pl + cW} y2={pt + (1 - p) * cH} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {[0, 0.5, 1].map(p => (
        <text key={p} x={pl - 8} y={pt + (1 - p) * cH + 4} textAnchor="end" fill="rgba(148,163,184,0.5)" fontSize="9.5">
          {p === 0 ? '₹0' : `₹${Math.round(max * p / 1000)}k`}
        </text>
      ))}
      <path d={area} fill={`url(#g${id})`} />
      <path d={line} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const skip = Math.ceil(pts.length / 4)
        const isSelected = i % skip === 0 || i === pts.length - 1
        if (!isSelected) return null
        return (
          <g key={i}>
            {pts.length <= 15 && (
              <circle cx={p.x} cy={p.y} r="2" fill={color} stroke="var(--card)" strokeWidth="1" />
            )}
            <text x={p.x} y={H - 6} textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="9">{p.day}</text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ breakdown = {} }) {
  const { pending = 0, invoiced = 0, paid = 0 } = breakdown
  const total = pending + invoiced + paid
  const segs = [
    { label: 'Paid', value: paid, color: '#00d68f' },
    { label: 'Invoiced', value: invoiced, color: '#7c6df8' },
    { label: 'Pending', value: pending, color: '#f5a623' },
  ]
  const R = 52, CX = 72, CY = 72, C = 2 * Math.PI * R
  let off = 0
  const segments = segs.map(s => {
    const da = total > 0 ? (s.value / total) * C : 0
    const seg = { ...s, da, off }; off += da; return seg
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg viewBox="0 0 144 144" style={{ width: 110, height: 110, flexShrink: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="20" />
        {segments.map((s, i) => s.value > 0 && (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.color} strokeWidth="20"
            strokeDasharray={`${s.da} ${C}`} strokeDashoffset={-s.off} />
        ))}
        <circle cx={CX} cy={CY} r={38} fill="var(--card)" />
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {segs.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--muted-light)', fontSize: 12.5, flex: 1 }}>{s.label}</span>
            <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13, fontFamily: 'DM Mono, monospace' }}>{s.value}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'var(--muted)' }}>Total orders</span>
          <span style={{ color: 'var(--text)', fontWeight: 800, fontFamily: 'DM Mono, monospace' }}>{total}</span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDays, setSelectedDays] = useState(7)

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 30000)
    return () => clearInterval(t)
  }, [selectedDays])

  async function fetchData() {
    try {
      const res = await fetch(`/api/analytics?days=${selectedDays}`)
      const d = await res.json()
      setData(d)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const kpis = data ? [
    { label: 'Total Revenue', value: `₹${(data.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, sub: 'from paid orders', icon: '◈', color: '#00d68f', bg: 'var(--emerald-dim)', borderColor: 'rgba(0,214,143,0.2)' },
    { label: 'GST Collected', value: `₹${Math.round(data.gstCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, sub: '18% of revenue', icon: '⬕', color: '#a095fb', bg: 'var(--violet-dim)', borderColor: 'rgba(124,109,248,0.2)' },
    { label: 'Revenue at Risk', value: `₹${(data.revenueAtRisk || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, sub: 'awaiting payment', icon: '⚠', color: '#f5a623', bg: 'var(--amber-dim)', borderColor: 'rgba(245,166,35,0.2)' },
    { label: 'Orders Today', value: String(data.ordersToday || 0), sub: 'new orders', icon: '▦', color: '#3b9eff', bg: 'var(--blue-dim)', borderColor: 'rgba(59,158,255,0.2)' },
  ] : []

  const Skeleton = () => (
    <div className="skeleton" style={{ height: 110, borderRadius: 16 }} />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div>
        <h1 style={{ fontSize: 23, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Analytics</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, fontWeight: 500 }}>
          Real-time business overview · refreshes every 30s
        </p>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid" style={{ display: 'grid', gap: 16 }}>
        {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} />) : kpis.map(k => <StatCard key={k.label} {...k} />)}
      </div>

      {/* Low Stock + Order Status Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Low Stock Alerts (LEFT) */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#f5a623', margin: 0, letterSpacing: '-0.01em' }}>Low Stock</p>
            {(() => {
              const lowStockCount = inventory.filter(item => item.quantity <= item.lowStockThreshold).length
              return lowStockCount > 0 ? <span style={{ background: '#f5a623', color: '#000', fontSize: 9, fontWeight: 700, padding: '3px 6px', borderRadius: 4, marginLeft: 'auto' }}>{lowStockCount}</span> : null
            })()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflow: 'auto' }}>
            {(() => {
              const lowStockItems = inventory.filter(item => item.quantity <= item.lowStockThreshold)
              if (lowStockItems.length === 0) {
                return <p style={{ color: 'var(--muted)', fontSize: 12, margin: 0 }}>All items stocked ✓</p>
              }
              return lowStockItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', background: 'rgba(245, 166, 35, 0.08)', borderRadius: 8, border: '1px solid rgba(245, 166, 35, 0.15)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{item.name}</p>
                    <p style={{ fontSize: 10, color: '#f5a623', margin: '2px 0 0', fontWeight: 600 }}>{item.quantity}{item.unit} left · Min: {item.lowStockThreshold}{item.unit}</p>
                  </div>
                  <a href="/dashboard/inventory" style={{ fontSize: 9, fontWeight: 700, color: '#f5a623', textDecoration: 'none', whiteSpace: 'nowrap', padding: '3px 6px', background: 'rgba(245, 166, 35, 0.15)', borderRadius: 4, border: '1px solid rgba(245, 166, 35, 0.25)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.target.style.background = 'rgba(245, 166, 35, 0.25)' }} onMouseLeave={e => { e.target.style.background = 'rgba(245, 166, 35, 0.15)' }}>Restock</a>
                </div>
              ))
            })()}
          </div>
        </div>

        {/* Order Status (RIGHT) */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: '0 0 18px', letterSpacing: '-0.01em' }}>Order Status</p>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DonutChart breakdown={data?.statusBreakdown} />
          </div>
        </div>
      </div>

      {/* Revenue Chart (FULL WIDTH) */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
              Revenue ({selectedDays <= 30 ? `${selectedDays} days` : selectedDays === 90 ? '3 months' : '1 year'})
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0', fontWeight: 500 }}>Paid orders only</p>
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
            {[
              { l: '7D', v: 7 }, { l: '10D', v: 10 }, { l: '30D', v: 30 }, { l: '3M', v: 90 }, { l: '1Y', v: 365 }
            ].map(opt => (
              <button key={opt.v} onClick={() => setSelectedDays(opt.v)} style={{
                fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 7, border: 'none',
                cursor: 'pointer', transition: 'all 0.2s',
                background: selectedDays === opt.v ? 'var(--emerald)' : 'transparent',
                color: selectedDays === opt.v ? '#000' : 'var(--muted)',
              }}>{opt.l}</button>
            ))}
          </div>
        </div>
        <AreaChart data={data?.revenueByDay || []} id="rev" />
      </div>

      {/* Charts row (removed - was Revenue + Order Status) */}

      {/* Top Buyers */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px' }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: '0 0 18px', letterSpacing: '-0.01em' }}>Top Buyers</p>
        {!data?.topBuyers?.length ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No buyer data yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {data.topBuyers.map((b, i) => {
              const colors = [['#00d68f', '#3b9eff'], ['#7c6df8', '#f4607b'], ['#f5a623', '#22c55e'], ['#3b9eff', '#7c6df8'], ['#f4607b', '#f5a623']]
              const [c1, c2] = colors[i % colors.length]
              return (
                <div key={b.phone} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 0', borderBottom: i < data.topBuyers.length - 1 ? '1px solid rgba(255,255,255,0.035)' : 'none',
                }}>
                  <span style={{ fontSize: 13, width: 24, textAlign: 'center', fontWeight: 800, color: 'var(--muted)', opacity: 0.8 }}>{i + 1}</span>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${c1}, ${c2})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#fff',
                  }}>
                    {b.phone?.slice(-2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text)', fontWeight: 600 }}>{b.phone}</p>
                    <p style={{ margin: 0, fontSize: 11.5, color: 'var(--muted)' }}>{b.totalOrders} orders · {b.languages?.join(', ')}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--teal)', letterSpacing: '-0.01em' }}>₹{b.totalSpent.toLocaleString('en-IN')}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>total spent</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}