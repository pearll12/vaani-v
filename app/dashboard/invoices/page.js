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
  const [isMobile, setIsMobile] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => { fetchOrders() }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  const totalPages = Math.ceil(filtered.length / rowsPerPage)
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  
  // Reset page when filter changes
  useEffect(() => { setCurrentPage(1) }, [filter, rowsPerPage])

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Invoices</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0', fontWeight: 500 }}>
            <span className="mobile-hide">18% GST (CGST 9% + SGST 9%) · </span>Invoice + Razorpay sent via WhatsApp
          </p>
        </div>
      </div>

      {/* GST Summary */}
      <div className="stat-grid-3">
        {[
          { label: 'Subtotal', value: `₹${totalSub.toLocaleString('en-IN')}`, color: 'var(--violet)', bg: 'var(--violet-dim)', border: 'rgba(124,109,248,0.2)' },
          { label: 'GST (18%)',  value: `₹${totalGST.toLocaleString('en-IN')}`, color: 'var(--amber)', bg: 'var(--amber-dim)', border: 'rgba(245,166,35,0.2)' },
          { label: 'Grand Total', value: `₹${totalGrand.toLocaleString('en-IN')}`, color: 'var(--emerald)', bg: 'var(--emerald-dim)', border: 'var(--emerald-border)' },
        ].map(k => (
          <div key={k.label} style={{
            background: k.bg, border: `1px solid ${k.border}`,
            borderRadius: 14, padding: isMobile ? '14px 18px' : '18px 22px',
          }}>
            <p style={{ fontSize: 10, color: k.color, opacity: 0.8, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{k.label}</p>
            <p style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: k.color, margin: 0, letterSpacing: '-0.02em' }}>{k.value}</p>
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

      {/* Desktop Table - Hidden on mobile */}
      <div className="bv-table-wrap" style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 48, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
          </div>
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
                {paginated.map(order => {
                  const sub   = Number(order.total_amount) || 0
                  const cgst  = +(sub * 0.09).toFixed(2)
                  const sgst  = +(sub * 0.09).toFixed(2)
                  const grand = +(sub + cgst + sgst).toFixed(2)
                  const lang  = order.language || 'english'
                  const date  = parseUtc(order.created_at)

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
                      <td>
                        <div>
                          <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
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
                        {order.status === 'pending' ? (
                          <button
                            className="btn-primary"
                            style={{ fontSize: 11, padding: '6px 12px', whiteSpace: 'nowrap' }}
                            onClick={() => sendInvoice(order)}
                            disabled={sending === order.id}
                          >
                            {sending === order.id ? (
                               '⏳ Sending...'
                            ) : (
                               '📲 Send Invoice'
                            )}
                          </button>
                        ) : order.status === 'invoiced' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <span style={{ fontSize: 12, color: 'var(--indigo)', fontWeight: 600 }}>📤 Sent</span>
                            <span style={{ fontSize: 9, color: 'var(--muted)' }}>WhatsApp</span>
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

      {/* Pagination Controls (Shared) */}
      {!loading && filtered.length > 5 && (
        <div style={{ padding: '12px 20px', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: 'var(--card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Rows per page:</span>
            <select 
              value={rowsPerPage} 
              onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '3px 8px', fontSize: 12, outline: 'none' }}
            >
              {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>
              {Math.min(filtered.length, (currentPage - 1) * rowsPerPage + 1)}-{Math.min(filtered.length, currentPage * rowsPerPage)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="btn-ghost"
                style={{ padding: '6px 12px' }}
              >‹ Prev</button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="btn-ghost"
                style={{ padding: '6px 12px' }}
              >Next ›</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Card List - Only visible on small screens */}
      {!loading && filtered.length > 0 && (
        <div className="invoice-card-list">
          {paginated.map(order => {
            const sub   = Number(order.total_amount) || 0
            const cgst  = +(sub * 0.09).toFixed(2)
            const sgst  = +(sub * 0.09).toFixed(2)
            const grand = +(sub + cgst + sgst).toFixed(2)
            const date  = parseUtc(order.created_at)

            return (
              <div key={order.id} className="invoice-item-card" style={{ 
                background: 'var(--card)', border: '1px solid var(--border)', padding: 14, borderRadius: 14
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                      #{String(order.id).padStart(4, '0')} · {date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}
                    </p>
                    <p style={{ margin: '4px 0', fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {order.customer_phone}
                    </p>
                    <LangBadge lang={order.language || 'english'} />
                  </div>
                  <span className={`badge badge-${order.status}`}>{order.status}</span>
                </div>

                <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(order.items || []).map((i, idx) => (
                      <div key={idx} className="mobile-card-row" style={{ fontSize: 12, alignItems: 'center' }}>
                        <span className="line-clamp-1" style={{ color: 'var(--text-soft)', flex: 1, marginRight: 8 }}>
                          {i.name}
                        </span>
                        <span style={{ color: 'var(--muted)', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                          ₹{i.price * i.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Amount</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>₹{grand.toFixed(2)}</div>
                  </div>
                  
                  {order.status === 'pending' ? (
                    <button
                      className="btn-primary"
                      style={{ fontSize: 12, padding: '10px 16px', borderRadius: 10 }}
                      onClick={() => sendInvoice(order)}
                      disabled={sending === order.id}
                    >
                      {sending === order.id ? '⏳ Sending...' : '📲 Invoice'}
                    </button>
                  ) : (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: order.status === 'paid' ? 'var(--emerald)' : 'var(--indigo)', fontWeight: 700, display: 'block' }}>
                        {order.status === 'paid' ? '✓ Paid' : '📤 Sent'}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 500 }}>on WhatsApp</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}


      {/* Invoice Result Modal */}
      {result && <InvoiceResult result={result} onClose={() => setResult(null)} />}

      {/* Toast */}
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}
