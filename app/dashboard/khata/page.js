'use client'
import { useEffect, useState } from 'react'

export default function KhataPage() {
  const [khata, setKhata]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState(null)
  const [sending, setSending]   = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchKhata() }, [])

  async function fetchKhata() {
    try {
      const res  = await fetch('/api/khata')
      const data = await res.json()
      if (Array.isArray(data)) setKhata(data)
    } catch {}
    setLoading(false)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function sendReminder(phone) {
    setSending(phone)
    try {
      const res  = await fetch('/api/khata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'settle_reminder' }),
      })
      const data = await res.json()
      if (data.success) showToast(`💰 Reminder sent! Balance: ₹${data.balance?.toFixed(2)}`)
      else showToast('Failed: ' + (data.error || 'Unknown'), 'error')
    } catch {
      showToast('Network error', 'error')
    }
    setSending(null)
  }

  const totalOutstanding = khata.reduce((s, k) => s + (Number(k.balance) || 0), 0)
  const totalRevenue     = khata.reduce((s, k) => s + (Number(k.total_amount) || 0), 0)
  const totalCollected   = khata.reduce((s, k) => s + (Number(k.total_paid) || 0), 0)
  const activeDebtors    = khata.filter(k => (Number(k.balance) || 0) > 0).length
  const highRisk         = khata.filter(k => (Number(k.balance) || 0) > 5000).length

  // Stats data with icons & colours
  const stats = [
    { label: 'Total Udhaar',    value: `₹${totalOutstanding.toLocaleString('en-IN')}`, icon: '💰', color: '#fb7185', bg: 'var(--rose-dim)',   border: 'var(--rose-border)' },
    { label: 'Total Business',  value: `₹${totalRevenue.toLocaleString('en-IN')}`,     icon: '📊', color: '#818cf8', bg: 'var(--indigo-dim)', border: 'var(--indigo-border)' },
    { label: 'Collected',       value: `₹${totalCollected.toLocaleString('en-IN')}`,    icon: '💸', color: '#00e5c3', bg: 'var(--teal-dim)',   border: 'var(--teal-border)' },
    { label: 'Debtors',         value: `${activeDebtors} / ${khata.length}`,            icon: '👥', color: '#f59e0b', bg: 'var(--amber-dim)',  border: 'var(--amber-border)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-up">

      {/* Header */}
      <div className="orders-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.03em' }}>
            📒 Khata <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Udhaar Ledger</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
            Customer-wise credit tracking · Auto-calculated from orders
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: totalOutstanding > 0 ? '#fb7185' : '#00e5c3', margin: 0, letterSpacing: '-0.03em', fontFamily: 'JetBrains Mono, monospace' }}>
            ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
            Total Udhaar
          </p>
        </div>
      </div>

      {/* ✨ NEW: Horizontal stats cards (responsive grid) ✨ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14,
      }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 20,
            padding: '16px 12px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: s.color, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </p>
            </div>
            <p style={{
              fontSize: 28,
              fontWeight: 800,
              color: s.color,
              margin: 0,
              fontFamily: 'JetBrains Mono, monospace',
              lineHeight: 1.2,
            }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* High Risk Warning */}
      {highRisk > 0 && (
        <div style={{
          background: 'var(--rose-dim)', border: '1px solid var(--rose-border)',
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <span style={{ color: '#fb7185', fontSize: 13, fontWeight: 600 }}>
            {highRisk} customer{highRisk > 1 ? 's' : ''} with udhaar above ₹5,000 — Send reminders!
          </span>
        </div>
      )}

      {/* Customer Ledger Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />)
        ) : khata.length === 0 ? (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '64px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>📒</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--muted-light)', margin: '0 0 6px' }}>No customers yet</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Khata entries appear automatically when orders are placed via WhatsApp</p>
          </div>
        ) : khata.map(customer => {
          const balance   = Number(customer.balance) || 0
          const isHigh    = balance > 5000
          const isExpanded = expanded === customer.customer_phone
          const collectPct = customer.total_amount > 0
            ? Math.min(100, Math.round((customer.total_paid / customer.total_amount) * 100))
            : 100

          return (
            <div key={customer.customer_phone} style={{
              background: 'var(--card)', border: `1px solid ${isHigh ? 'var(--rose-border)' : 'var(--border)'}`,
              borderRadius: 14, overflow: 'hidden',
              transition: 'all 0.2s',
            }}>
              {/* Main Row */}
              <div
                onClick={() => setExpanded(isExpanded ? null : customer.customer_phone)}
                style={{
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  cursor: 'pointer',
                  flexWrap: 'wrap',
                }}
              >
                {/* Left: Avatar + Phone */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: isHigh
                      ? 'linear-gradient(135deg, #fb718530, #f59e0b30)'
                      : 'linear-gradient(135deg, #00e5c330, #818cf830)',
                    border: `1px solid ${isHigh ? 'rgba(251,113,133,0.3)' : 'rgba(0,229,195,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: isHigh ? '#fb7185' : '#00e5c3',
                  }}>
                    {customer.customer_phone?.slice(-2)}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {customer.customer_phone}
                    </p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span style={{
                        fontSize: 9.5, padding: '1px 7px', borderRadius: 4,
                        background: 'var(--indigo-dim)', color: '#818cf8',
                        border: '1px solid var(--indigo-border)', fontWeight: 700,
                      }}>
                        {customer.total_orders} orders
                      </span>
                      {isHigh && (
                        <span style={{
                          fontSize: 9.5, padding: '1px 7px', borderRadius: 4,
                          background: 'var(--rose-dim)', color: '#fb7185',
                          border: '1px solid var(--rose-border)', fontWeight: 700,
                        }}>⚠ High Risk</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Progress bar */}
                <div style={{ flex: 1, minWidth: 120, maxWidth: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
                    <span>Collection</span>
                    <span style={{ color: collectPct >= 80 ? '#00e5c3' : collectPct >= 50 ? '#f59e0b' : '#fb7185', fontWeight: 700 }}>
                      {collectPct}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%', height: 6, borderRadius: 3,
                    background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${collectPct}%`, height: '100%', borderRadius: 3,
                      background: collectPct >= 80 ? '#00e5c3' : collectPct >= 50 ? '#f59e0b' : '#fb7185',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                {/* Right: Balance + Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      margin: 0, fontSize: 18, fontWeight: 800,
                      fontFamily: 'JetBrains Mono, monospace',
                      color: balance > 0 ? '#fb7185' : '#00e5c3',
                    }}>
                      {balance > 0 ? `₹${balance.toLocaleString('en-IN')}` : '✅ Clear'}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {balance > 0 ? 'udhaar' : 'settled'}
                    </p>
                  </div>

                  {balance > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); sendReminder(customer.customer_phone) }}
                      disabled={sending === customer.customer_phone}
                      style={{
                        background: 'var(--amber-dim)', color: '#f59e0b',
                        border: '1px solid var(--amber-border)',
                        padding: '8px 14px', borderRadius: 9, fontSize: 11.5, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                        transition: 'all 0.15s', whiteSpace: 'nowrap',
                      }}
                    >
                      {sending === customer.customer_phone ? '⏳...' : '💰 Remind'}
                    </button>
                  )}

                  <span style={{ fontSize: 16, color: 'var(--muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    ▾
                  </span>
                </div>
              </div>

              {/* Expanded: Order History */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  padding: '16px 20px',
                  background: 'rgba(0,0,0,0.15)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--muted-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      📜 Order History
                    </p>
                    <div style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
                      <span>Total: <b style={{ color: '#818cf8' }}>₹{customer.total_amount.toLocaleString('en-IN')}</b></span>
                      <span>·</span>
                      <span>Paid: <b style={{ color: '#00e5c3' }}>₹{customer.total_paid.toLocaleString('en-IN')}</b></span>
                    </div>
                  </div>

                  {(customer.orders || []).map(order => {
                    const statusColors = {
                      paid:     { bg: 'var(--teal-dim)',   color: '#00e5c3', border: 'var(--teal-border)',   label: 'Paid ✅' },
                      invoiced: { bg: 'var(--indigo-dim)', color: '#818cf8', border: 'var(--indigo-border)', label: 'Invoiced 📄' },
                      pending:  { bg: 'var(--amber-dim)',  color: '#f59e0b', border: 'var(--amber-border)',  label: 'Pending ⏳' },
                    }
                    const st = statusColors[order.status] || statusColors.pending

                    return (
                      <div key={order.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', borderRadius: 10, marginBottom: 6,
                        background: order.status === 'paid' ? 'rgba(0,229,195,0.04)' : 'rgba(251,113,133,0.04)',
                        border: `1px solid ${order.status === 'paid' ? 'rgba(0,229,195,0.12)' : 'rgba(251,113,133,0.12)'}`,
                        flexWrap: 'wrap', gap: 8,
                      }}>
                        <div style={{ minWidth: 120 }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>
                            #{String(order.id).padStart(4, '0')}
                          </span>
                          <span style={{
                            marginLeft: 8, fontSize: 9.5, padding: '1px 7px', borderRadius: 4,
                            background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontWeight: 700,
                          }}>
                            {st.label}
                          </span>
                        </div>

                        <div style={{ flex: 1, fontSize: 11.5, color: 'var(--muted-light)' }}>
                          {(order.items || []).map(i => `${i.quantity || 1}× ${i.name}`).join(', ') || '—'}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                            color: order.status === 'paid' ? '#00e5c3' : '#fb7185',
                          }}>
                            ₹{Number(order.grand_total || 0).toLocaleString('en-IN')}
                          </span>
                          <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)' }}>
                            {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {toast && (
        <div className="toast" style={{
          borderColor: toast.type === 'error' ? 'var(--rose-border)' : 'rgba(0,229,195,0.25)',
        }}>
          <span style={{ fontSize: 18 }}>{toast.type === 'error' ? '⚠' : '✓'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  )
}