'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const LANG_COLOR = {
  tamil: '#f97316', marathi: '#a855f7', telugu: '#3b82f6',
  hindi: '#22c55e', hinglish: '#eab308', english: '#94a3b8',
}

function LangBadge({ lang }) {
  const color = LANG_COLOR[lang] || '#94a3b8'
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 5, fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}30`,
      letterSpacing: '0.04em', textTransform: 'capitalize',
    }}>{lang}</span>
  )
}

function EmptyState({ filter }) {
  return (
    <div style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>⬕</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted-light)', margin: '0 0 6px' }}>No orders here</p>
      <p style={{ fontSize: 13, margin: 0 }}>{filter === 'all' ? 'Orders will appear as they come in via WhatsApp' : `No ${filter} orders yet`}</p>
    </div>
  )
}

function InvoiceResult({ result, onClose }) {
  if (!result) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
            background: result.success ? 'var(--emerald-dim)' : 'var(--rose-dim)',
            border: `1px solid ${result.success ? 'var(--emerald-border)' : 'rgba(244,96,123,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>
            {result.success ? '✓' : '✕'}
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: result.success ? 'var(--emerald)' : '#f4607b' }}>
            {result.success ? 'Invoice Sent!' : 'Failed to Send'}
          </h3>
          {result.error && <p style={{ color: 'var(--muted-light)', fontSize: 13, margin: '8px 0 0' }}>{result.error}</p>}
        </div>

        {result.success && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {result.invoiceUrl && (
              <a href={result.invoiceUrl} target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                background: 'var(--blue-dim)', border: '1px solid rgba(59,158,255,0.2)',
                borderRadius: 10, textDecoration: 'none', color: 'var(--blue)',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 18 }}>📄</span>
                <span>View Invoice PDF</span>
                <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 11 }}>↗</span>
              </a>
            )}
            {result.paymentUrl && (
              <a href={result.paymentUrl} target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                background: 'var(--emerald-dim)', border: '1px solid var(--emerald-border)',
                borderRadius: 10, textDecoration: 'none', color: 'var(--emerald)',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 18 }}>💳</span>
                <span>Razorpay Payment Link</span>
                <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 11 }}>↗</span>
              </a>
            )}
            <div style={{
              padding: '11px 16px', background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)', borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--muted-light)',
            }}>
              <span style={{ fontSize: 16 }}>💬</span>
              <span>WhatsApp message sent with invoice + payment link</span>
            </div>
          </div>
        )}
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}

export default function InvoicesPage() {
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(null)
  const [filter, setFilter]     = useState('all')
  const [toast, setToast]       = useState('')
  const [result, setResult]     = useState(null)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (data) setOrders(data)
    setLoading(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  async function sendInvoice(order) {
    setSending(order.id)
    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, phone: order.customer_phone }),
      })
      const data = await res.json()
      setResult({ success: !!data.success, ...data })
      if (data.success) await fetchOrders()
    } catch (e) {
      setResult({ success: false, error: 'Network error. Please try again.' })
    }
    setSending(null)
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const counts = {
    all: orders.length,
    pending:  orders.filter(o => o.status === 'pending').length,
    invoiced: orders.filter(o => o.status === 'invoiced').length,
    paid:     orders.filter(o => o.status === 'paid').length,
  }

  const TAB_FILTERS = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'invoiced', label: 'Invoiced' },
    { key: 'paid',     label: 'Paid' },
  ]

  const paidOrders   = orders.filter(o => o.status !== 'pending')
  const totalSub     = paidOrders.reduce((s, o) => s + (o.total_amount || 0), 0)
  const totalGST     = +(totalSub * 0.18).toFixed(2)
  const totalGrand   = +(totalSub + totalGST).toFixed(2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 23, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Invoices</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0', fontWeight: 500 }}>
          18% GST (CGST 9% + SGST 9%) · Invoice + Razorpay link sent automatically via WhatsApp
        </p>
      </div>

      {/* GST Summary */}
      <div className="stat-grid-3">
        {[
          { label: 'Invoiced Subtotal', value: `₹${totalSub.toLocaleString('en-IN')}`, color: 'var(--violet)', bg: 'var(--violet-dim)', border: 'rgba(124,109,248,0.2)' },
          { label: 'GST Collected (18%)',  value: `₹${totalGST.toLocaleString('en-IN')}`, color: 'var(--amber)', bg: 'var(--amber-dim)', border: 'rgba(245,166,35,0.2)' },
          { label: 'Grand Total',     value: `₹${totalGrand.toLocaleString('en-IN')}`, color: 'var(--emerald)', bg: 'var(--emerald-dim)', border: 'var(--emerald-border)' },
        ].map(k => (
          <div key={k.label} style={{
            background: k.bg, border: `1px solid ${k.border}`,
            borderRadius: 14, padding: '18px 22px',
          }}>
            <p style={{ fontSize: 10.5, color: k.color, opacity: 0.8, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{k.label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: k.color, margin: 0, letterSpacing: '-0.02em' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6 }}>
        {TAB_FILTERS.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} className={`filter-tab ${filter === t.key ? 'active' : 'inactive'}`}>
            {t.label}
            {counts[t.key] > 0 && <span className="filter-count">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 48, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="bv-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th style={{ textAlign: 'right' }}>CGST 9%</th>
                  <th style={{ textAlign: 'right' }}>SGST 9%</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const sub   = Number(order.total_amount) || 0
                  const cgst  = +(sub * 0.09).toFixed(2)
                  const sgst  = +(sub * 0.09).toFixed(2)
                  const grand = +(sub + cgst + sgst).toFixed(2)
                  const lang  = order.language || 'english'
                  const date  = new Date(order.created_at)

                  return (
                    <tr key={order.id}>
                      <td>
                        <div>
                          <p style={{ margin: 0, fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--muted-light)', fontWeight: 500 }}>
                            #{String(order.id).padStart(4, '0')}
                          </p>
                          <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#d4e0ee', fontSize: 13 }}>
                            {order.customer_phone}
                          </p>
                          <LangBadge lang={lang} />
                        </div>
                      </td>
                      <td style={{ maxWidth: 200 }}>
                        <div style={{ fontSize: 12.5, color: 'var(--muted-light)', lineHeight: 1.5 }}>
                          {(order.items || []).map((i, idx) => (
                            <span key={idx}>
                              {idx > 0 && <span style={{ color: 'var(--muted)', margin: '0 4px' }}>·</span>}
                              <span style={{ color: '#b8c5d4', fontWeight: 500 }}>{i.name}</span>
                              <span style={{ color: 'var(--muted)', fontSize: 11 }}> (₹{i.price}) ×{i.quantity}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#b8c5d4' }}>₹{sub.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#a095fb' }}>₹{cgst.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#a095fb' }}>₹{sgst.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, color: '#e8edf5' }}>₹{grand.toFixed(2)}</span>
                      </td>
                      <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                      <td>
                        {order.status === 'pending' ? (
                          <button
                            className="btn-primary"
                            style={{ fontSize: 12, padding: '7px 14px', whiteSpace: 'nowrap' }}
                            onClick={() => sendInvoice(order)}
                            disabled={sending === order.id}
                          >
                            {sending === order.id ? (
                              <>⏳ Sending…</>
                            ) : (
                              <>📲 Send Invoice</>
                            )}
                          </button>
                        ) : order.status === 'invoiced' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <span style={{ fontSize: 12, color: '#a095fb', fontWeight: 600 }}>📤 Sent</span>
                            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>WhatsApp + Razorpay</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 600 }}>✓ Paid</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Result Modal */}
      {result && <InvoiceResult result={result} onClose={() => setResult(null)} />}

      {/* Toast */}
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}
