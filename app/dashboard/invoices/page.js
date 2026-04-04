'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const parseUtc = (ds) => !ds ? null : new Date(typeof ds === 'string' && !ds.endsWith('Z') && !ds.includes('+') ? ds + 'Z' : ds)


const LANG_COLOR = {
  tamil: '#f97316', marathi: '#a855f7', telugu: '#3b82f6',
  hindi: '#22c55e', hinglish: '#eab308', english: 'var(--muted-light)',
}

function LangBadge({ lang }) {
  const color = LANG_COLOR[lang] || 'var(--muted-light)'
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
            background: result.success && !result.warning ? 'var(--emerald-dim)' : (result.success && result.warning ? 'var(--amber-dim)' : 'var(--rose-dim)'),
            border: `1px solid ${result.success && !result.warning ? 'var(--emerald-border)' : (result.success && result.warning ? 'var(--amber)' : 'rgba(244,96,123,0.2)')}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>
            {result.success && !result.warning ? '✓' : (result.success && result.warning ? '⚠️' : '✕')}
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: result.success && !result.warning ? 'var(--emerald)' : (result.success && result.warning ? 'var(--amber)' : '#f4607b') }}>
            {result.success && !result.warning ? 'Invoice Sent!' : (result.success && result.warning ? 'Partially Successful' : 'Failed to Send')}
          </h3>
          {result.error && <p style={{ color: 'var(--rose)', fontSize: 13, margin: '8px 0 0' }}>{result.error}</p>}
          {result.warning && <p style={{ color: 'var(--amber)', fontSize: 13, margin: '8px 0 0' }}>{result.warning}</p>}
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
  const [viewingInvoice, setViewingInvoice] = useState(null)

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

  async function viewInvoice(orderId) {
    setViewingInvoice(orderId)
    try {
      const storagePath = `invoice-${orderId}.pdf`
      const { data, error } = await supabase.storage
        .from('invoices')
        .createSignedUrl(storagePath, 60 * 60) // 1 hour
      if (error || !data?.signedUrl) {
        showToast('⚠ Invoice not found — send invoice first')
      } else {
        window.open(data.signedUrl, '_blank')
      }
    } catch {
      showToast('⚠ Failed to load invoice')
    }
    setViewingInvoice(null)
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const counts = {
    all: orders.length,
    pending:  orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    invoiced: orders.filter(o => o.status === 'invoiced').length,
    paid:     orders.filter(o => o.status === 'paid').length,
  }

  const TAB_FILTERS = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'invoiced',  label: 'Invoiced' },
    { key: 'paid',      label: 'Paid' },
  ]

  const paidOrders   = orders.filter(o => o.status !== 'pending')
  const totalSub     = paidOrders.reduce((s, o) => s + (o.total_amount || 0), 0)
  const totalGST     = +(totalSub * 0.18).toFixed(2)
  const totalGrand   = +(totalSub + totalGST).toFixed(2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 23, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Invoices</h1>
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
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TAB_FILTERS.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} className={`filter-tab ${filter === t.key ? 'active' : 'inactive'}`}>
            {t.label}
            {counts[t.key] > 0 && <span className="filter-count">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {/* Table & Mobile Card List Wrapper */}
      <div className="bv-table-container">
        {loading ? (
          <div style={{ padding: 48, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <>
            <div className="desktop-only">
              <div className="bv-table-wrap">
                <table className="bv-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th className="mobile-hide">Customer</th>
                      <th className="mobile-hide">Items</th>
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
                      const date  = parseUtc(order.created_at)
                      const canViewInvoice = ['confirmed', 'invoiced', 'paid'].includes(order.status)

                      return (
                        <tr key={order.id}>
                          <td>
                            <div>
                              <p style={{ margin: 0, fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--muted-light)', fontWeight: 500 }}>
                                #{String(order.id).padStart(4, '0')}
                              </p>
                              <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                {date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </td>
                          <td className="mobile-hide">
                            <div>
                              <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
                                {order.customer_phone}
                              </p>
                              <LangBadge lang={lang} />
                            </div>
                          </td>
                          <td className="mobile-hide" style={{ maxWidth: 200 }}>
                            <div style={{ fontSize: 12.5, color: 'var(--muted-light)', lineHeight: 1.5 }}>
                              {(order.items || []).map((i, idx) => (
                                <span key={idx}>
                                  {idx > 0 && <span style={{ color: 'var(--muted)', margin: '0 4px' }}>·</span>}
                                  <span style={{ color: 'var(--muted-light)', fontWeight: 500 }}>{i.name}</span>
                                  <span style={{ color: 'var(--muted)', fontSize: 11 }}> (₹{i.price}) ×{i.quantity}</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--text)' }}>₹{sub.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--indigo)' }}>₹{cgst.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--indigo)' }}>₹{sgst.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>₹{grand.toFixed(2)}</span>
                          </td>
                          <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 130 }}>
                                {order.status === 'pending' ? (
                                  <button
                                    className="btn-primary"
                                    style={{ fontSize: 12, padding: '7px 14px', whiteSpace: 'nowrap', width: '100%' }}
                                    onClick={() => sendInvoice(order)}
                                    disabled={sending === order.id}
                                  >
                                    {sending === order.id ? <>⏳ Sending…</> : <>📲 Send Invoice</>}
                                  </button>
                                ) : order.status === 'invoiced' ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <span style={{ fontSize: 12, color: 'var(--indigo)', fontWeight: 600 }}>📤 Sent</span>
                                    <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>WhatsApp + Razorpay</span>
                                  </div>
                                ) : order.status === 'paid' ? (
                                  <span style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 600 }}>✓ Paid</span>
                                ) : null}
                              </div>

                              {canViewInvoice && (
                                <button
                                  onClick={() => viewInvoice(order.id)}
                                  disabled={viewingInvoice === order.id}
                                  style={{
                                    background: 'rgba(129,140,248,0.08)', color: '#818cf8',
                                    border: '1px solid rgba(129,140,248,0.2)', padding: '5px 12px',
                                    borderRadius: 8, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                                    fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.15s',
                                    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.16)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.08)'; e.currentTarget.style.transform = 'translateY(0)' }}
                                >
                                  {viewingInvoice === order.id ? <>⏳ Loading…</> : <>📄 View</>}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card List */}
            <div className="mobile-only" style={{ padding: '0px' }}>
              <div className="card-list-mobile">
                {filtered.map(order => {
                  const sub   = Number(order.total_amount) || 0
                  const grand = +(sub * 1.18).toFixed(2)
                  const date  = parseUtc(order.created_at)
                  const canViewInvoice = ['confirmed', 'invoiced', 'paid'].includes(order.status)

                  return (
                    <div key={order.id} className="mobile-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                            #{String(order.id).padStart(4, '0')}
                          </h4>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                            {date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <span className={`badge badge-${order.status}`} style={{ fontSize: 10, padding: '3px 8px' }}>
                          {order.status}
                        </span>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
                          {order.customer_phone}
                        </p>
                        <div style={{ fontSize: 11, color: 'var(--muted-light)', marginTop: 4, lineHeight: 1.4 }}>
                          {(order.items || []).map((i, idx) => (
                            <span key={idx}>
                              {idx > 0 && <span style={{ color: 'var(--muted)', margin: '0 4px' }}>·</span>}
                              {i.quantity}× {i.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mobile-card-row" style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', marginTop: 12 }}>
                        <div>
                          <p className="mobile-card-label" style={{ fontSize: 9 }}>Amount</p>
                          <p className="mobile-card-value" style={{ fontSize: 15, color: 'var(--emerald)', fontWeight: 700 }}>₹{grand.toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        {order.status === 'pending' ? (
                          <button
                            className="btn-primary"
                            style={{ flex: 1, padding: '8px', fontSize: 12 }}
                            onClick={() => sendInvoice(order)}
                            disabled={sending === order.id}
                          >
                            {sending === order.id ? 'Sending…' : 'Send Invoice'}
                          </button>
                        ) : order.status === 'paid' ? (
                          <span style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 600, flex: 1, display: 'flex', alignItems: 'center' }}>✓ Paid</span>
                        ) : order.status === 'invoiced' ? (
                          <span style={{ fontSize: 12, color: 'var(--indigo)', fontWeight: 600, flex: 1, display: 'flex', alignItems: 'center' }}>📤 Sent</span>
                        ) : null}

                        {canViewInvoice && (
                          <button
                            onClick={() => viewInvoice(order.id)}
                            disabled={viewingInvoice === order.id}
                            style={{
                              flex: order.status === 'paid' ? 0 : 1,
                              background: 'rgba(129,140,248,0.08)', color: '#818cf8',
                              border: '1px solid rgba(129,140,248,0.2)', padding: '8px 12px',
                              borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            }}
                          >
                            {viewingInvoice === order.id ? '⏳' : '📄 View'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
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
