'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const parseUtc = (ds) => !ds ? null : new Date(typeof ds === 'string' && !ds.endsWith('Z') && !ds.includes('+') ? ds + 'Z' : ds)


const STATUS = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'var(--amber-dim)',  border: 'var(--amber-border)' },
  invoiced: { label: 'Invoiced', color: '#818cf8', bg: 'var(--indigo-dim)', border: 'var(--indigo-border)' },
  paid:     { label: 'Paid',     color: '#00e5c3', bg: 'var(--teal-dim)',   border: 'var(--teal-border)' },
}

function PaymentTimeline({ status }) {
  const steps = [
    { key: 'pending',  icon: '◦', label: 'Order' },
    { key: 'invoiced', icon: '→', label: 'Invoiced' },
    { key: 'paid',     icon: '✓', label: 'Paid' },
  ]
  const idx = ['pending','invoiced','paid'].indexOf(status)
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {steps.map((s, i) => {
        const done = i <= idx
        const curr = i === idx
        const sc   = STATUS[s.key]
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
            <div title={s.label} style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: done ? sc.bg : 'rgba(255,255,255,0.04)',
              border: `2px solid ${done ? sc.color : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: done ? sc.color : 'var(--muted)',
              boxShadow: curr ? `0 0 12px ${sc.color}40` : 'none',
              transition: 'all 0.3s', fontWeight: 700,
            }}>
              {done ? s.icon : ''}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 24, height: 2,
                background: i < idx ? 'rgba(0,229,195,0.35)' : 'rgba(255,255,255,0.06)',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function PaymentsPage() {
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(null)
  const [filter, setFilter]     = useState('all')
  const [toast, setToast]       = useState(null)
  const [justPaid, setJustPaid] = useState(null)
  const interval                = useRef(null)

  useEffect(() => {
    // Check for Razorpay callback
    const params = new URLSearchParams(window.location.search)
    const paidId = params.get('paid')
    if (paidId) {
      setJustPaid(paidId)
      window.history.replaceState({}, '', '/dashboard/payments')
      setTimeout(() => setJustPaid(null), 5000)
    }

    fetchOrders()
    interval.current = setInterval(fetchOrders, 8000) // fast refresh for payment tracking
    return () => clearInterval(interval.current)
  }, [])

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (data) setOrders(data)
    setLoading(false)
  }

  async function markPaid(orderId) {
    setUpdating(orderId)
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: 'paid' }),
    })
    await fetchOrders()
    setUpdating(null)
    showToast('✓ Order marked as paid')
  }

  async function sendReminder(order) {
    setUpdating(`remind-${order.id}`)
    try {
      const res  = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await res.json()
      showToast(data.success ? '⏰ Reminder sent!' : 'Failed to send reminder')
    } catch { showToast('Network error') }
    setUpdating(null)
    await fetchOrders()
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800) }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const stats = {
    pending:  orders.filter(o => o.status === 'pending').length,
    invoiced: orders.filter(o => o.status === 'invoiced').length,
    paid:     orders.filter(o => o.status === 'paid').length,
    revenue:  orders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.total_amount || 0) * 1.18, 0),
    pending_value: orders.filter(o => o.status !== 'paid').reduce((s, o) => s + (o.total_amount || 0) * 1.18, 0),
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.03em' }}>Payments</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
            <span className="live-dot" style={{ width: 7, height: 7, background: 'var(--teal)' }} />
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontWeight: 500 }}>Razorpay sync · refreshes every 8s</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--teal)', margin: 0, letterSpacing: '-0.03em', fontFamily: 'JetBrains Mono, monospace' }}>
            ₹{Math.round(stats.revenue).toLocaleString('en-IN')}
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Collected (incl. GST)</p>
        </div>
      </div>

      {/* Just paid success banner */}
      {justPaid && (
        <div style={{
          background: 'var(--teal-dim)', border: '2px solid var(--teal)',
          borderRadius: 14, padding: '16px 22px',
          display: 'flex', alignItems: 'center', gap: 14,
          animation: 'fadeUp 0.4s ease',
        }}>
          <span style={{ fontSize: 28 }}>🎉</span>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--teal)' }}>Payment Received!</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--teal)', opacity: 0.8 }}>
              Razorpay payment confirmed — order automatically updated to Paid
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
}}>
        {[
          { label: 'Pending',  count: stats.pending,  ...STATUS.pending },
          { label: 'Invoiced', count: stats.invoiced, ...STATUS.invoiced },
          { label: 'Paid',     count: stats.paid,     ...STATUS.paid },
          {
            label: 'Pending Value', count: `₹${Math.round(stats.pending_value).toLocaleString('en-IN')}`,
            color: '#f59e0b', bg: 'var(--amber-dim)', border: 'var(--amber-border)',
          },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 16, padding: '18px 20px', position: 'relative', overflow: 'hidden',
          }}>
            <p style={{ fontSize: 10, color: s.color, opacity: 0.8, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0, letterSpacing: '-0.03em', fontFamily: 'JetBrains Mono, monospace' }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Razorpay info banner */}
      <div style={{
        background: 'rgba(129,140,248,0.06)',
        border: '1px solid rgba(129,140,248,0.18)',
        borderRadius: 12, padding: '12px 18px',
        display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
      }}>
        <span style={{ fontSize: 20 }}>💳</span>
        <span style={{ color: 'var(--indigo)', fontWeight: 500 }}>
          Razorpay webhooks are active — payments automatically reflect here when customers pay
        </span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { key: 'all',      label: 'All',      count: orders.length },
          { key: 'pending',  label: 'Pending',  count: stats.pending },
          { key: 'invoiced', label: 'Invoiced', count: stats.invoiced },
          { key: 'paid',     label: 'Paid',     count: stats.paid },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} className={`filter-tab ${filter === t.key ? 'active' : 'inactive'}`}>
            {t.label}
            {t.count > 0 && <span className="filter-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 16 }} />)
        ) : filtered.length === 0 ? (
          <div style={{
            padding: '56px 32px', textAlign: 'center',
            background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.2 }}>◈</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--muted-light)', margin: 0 }}>
              No {filter === 'all' ? '' : filter} orders
            </p>
          </div>
        ) : filtered.map(order => {
          const grand  = +(Number(order.total_amount) * 1.18).toFixed(2)
          const time   = parseUtc(order.created_at)
          const isToday = new Date().toDateString() === time.toDateString()
          const isOverdue = order.status === 'invoiced' && order.invoice_sent_at &&
            (Date.now() - new Date(order.invoice_sent_at)) > 24 * 60 * 60 * 1000
          const reminderCount = order.reminder_count || 0
          const isJustPaid = String(order.id) === String(justPaid)

          return (
            <div key={order.id} style={{
              background: isJustPaid ? 'rgba(0,229,195,0.08)' : 'var(--card)',
              border: `1px solid ${isJustPaid ? 'var(--teal)' : isOverdue ? 'var(--amber-border)' : 'var(--border)'}`,
              borderRadius: 16, padding: '16px 22px',
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'border-color 0.2s, background 0.2s',
            }}>
              {/* Order + customer */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>
                    #{String(order.id).padStart(4, '0')}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {order.customer_phone}
                  </span>
                  {isOverdue && (
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 5,
                      background: 'var(--amber-dim)', color: 'var(--amber)',
                      border: '1px solid var(--amber-border)', fontWeight: 700,
                    }}>
                      ⏰ Overdue
                    </span>
                  )}
                  {reminderCount > 0 && (
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 5,
                      background: 'var(--indigo-dim)', color: 'var(--indigo)',
                      border: '1px solid var(--indigo-border)', fontWeight: 700,
                    }}>
                      {reminderCount} reminder{reminderCount > 1 ? 's' : ''} sent
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted-light)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(order.items || []).map((item, i) => (
                    <span key={i}>
                      {item.name} <span style={{ color: 'var(--muted)', fontSize: 11 }}>×{item.quantity}</span>
                    </span>
                  ))}
                </p>
              </div>

              {/* Amount */}
              <div style={{ textAlign: 'right', minWidth: 100 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: order.status === 'paid' ? 'var(--teal)' : 'var(--text)', letterSpacing: '-0.01em', fontFamily: 'JetBrains Mono, monospace' }}>
                  ₹{grand.toLocaleString('en-IN')}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {isToday
                    ? time.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
                    : time.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}
                </p>
              </div>

              {/* Timeline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PaymentTimeline status={order.status} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, minWidth: 130, justifyContent: 'flex-end' }}>
                {order.status === 'invoiced' && (
                  <>
                    <button
                      style={{
                        background: 'var(--amber-dim)', color: 'var(--amber)',
                        border: '1px solid var(--amber-border)',
                        padding: '6px 12px', borderRadius: 9, fontSize: 11.5, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                        transition: 'all 0.15s',
                      }}
                      onClick={() => sendReminder(order)}
                      disabled={updating === `remind-${order.id}`}
                      title="Send payment reminder"
                    >
                      {updating === `remind-${order.id}` ? '…' : '⏰'}
                    </button>
                    <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}
                      onClick={() => markPaid(order.id)} disabled={updating === order.id}>
                      {updating === order.id ? '…' : '✓ Mark Paid'}
                    </button>
                  </>
                )}
                {order.status === 'paid' && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 9,
                    background: 'var(--teal-dim)', color: 'var(--teal)',
                    border: '1px solid var(--teal-border)', fontSize: 12, fontWeight: 700,
                  }}>
                    ✓ Paid
                    {order.razorpay_payment_id && (
                      <span style={{ fontSize: 9.5, opacity: 0.7, fontFamily: 'JetBrains Mono, monospace' }}>
                        · RZP
                      </span>
                    )}
                  </div>
                )}
                {order.status === 'pending' && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 9,
                    background: 'var(--amber-dim)', color: 'var(--amber)',
                    border: '1px solid var(--amber-border)', fontSize: 12, fontWeight: 700,
                  }}>
                    Pending
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {toast && (
        <div className="toast">
          <span style={{ fontSize: 18 }}>💰</span>
          {toast}
        </div>
      )}
    </div>
  )
}
