'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const parseUtc = (ds) => !ds ? null : new Date(typeof ds === 'string' && !ds.endsWith('Z') && !ds.includes('+') ? ds + 'Z' : ds)


const LANG_COLOR = {
  tamil: '#fb7185', marathi: '#818cf8', telugu: '#38bdf8',
  hindi: '#a3e635', hinglish: '#f59e0b', english: 'var(--muted-light)',
}

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'var(--amber-dim)',  border: 'var(--amber-border)' },
  invoiced: { label: 'Invoiced', color: '#818cf8', bg: 'var(--indigo-dim)', border: 'var(--indigo-border)' },
  paid:     { label: 'Paid',     color: '#00e5c3', bg: 'var(--teal-dim)',   border: 'var(--teal-border)' },
  assigned: { label: 'Assigned', color: '#38bdf8', bg: 'var(--indigo-dim)', border: 'var(--indigo-border)' },
  shipped:  { label: 'Shipped',  color: '#818cf8', bg: 'var(--indigo-dim)', border: 'var(--indigo-border)' },
  delivered:{ label: 'Delivered',color: '#10b981', bg: 'var(--teal-dim)',   border: 'var(--teal-border)' },
}

// Enrich order items with inventory prices if missing
function enrichOrdersWithPrices(orders, inventory) {
  if (!Array.isArray(orders)) return []
  const invArray = Array.isArray(inventory) ? inventory : []
  if (invArray.length === 0) return orders
  
  return orders.map(order => {
    const items = (order.items || []).map(item => {
      if (Number(item.price) > 0) return item // already has price
      const itemNameLower = (item.name || '').toLowerCase().trim()
      const match = invArray.find(inv =>
        (inv.name || '').toLowerCase().trim() === itemNameLower
      ) || invArray.find(inv =>
        (inv.name || '').toLowerCase().trim().includes(itemNameLower) ||
        itemNameLower.includes((inv.name || '').toLowerCase().trim())
      )
      if (match) {
        return { ...item, price: Number(match.price) || 0, unit: match.unit || item.unit || 'pcs' }
      }
      return item
    })
    // Recalculate total if it was 0
    const calcTotal = items.reduce((s, i) => s + (Number(i.quantity) || 1) * (Number(i.price) || 0), 0)
    const total_amount = Number(order.total_amount) > 0 ? Number(order.total_amount) : calcTotal
    return { ...order, items, total_amount }
  })
}

// Consistent GST calculation used everywhere
function calcGST(totalAmount) {
  const sub   = Number(totalAmount) || 0
  const cgst  = +(sub * 0.09).toFixed(2)
  const sgst  = +(sub * 0.09).toFixed(2)
  const grand = +(sub + cgst + sgst).toFixed(2)
  return { sub, cgst, sgst, grand }
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 6, fontSize: 10.5, fontWeight: 700,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color }} />
      {m.label}
    </span>
  )
}

function EditOrderModal({ order, inventory, onClose, onSave, saving }) {
  const [items, setItems] = useState(
    (order.items || []).map(i => ({
      name: i.name || '',
      quantity: Number(i.quantity) || 1,
      price: Number(i.price) || 0,
      unit: i.unit || 'pcs',
      notes: i.notes || '',
    }))
  )

  const updateItem = (idx, key, val) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item))
  }

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const addItem = () => {
    setItems(prev => [...prev, { name: '', quantity: 1, price: 0, unit: 'pcs', notes: '' }])
  }

  // Auto-fill price from inventory when name changes
  const handleNameChange = (idx, val) => {
    updateItem(idx, 'name', val)
    const match = (Array.isArray(inventory) ? inventory : []).find(inv =>
      (inv.name || '').toLowerCase().trim() === val.toLowerCase().trim()
    )
    if (match) {
      updateItem(idx, 'price', Number(match.price) || 0)
      updateItem(idx, 'unit', match.unit || 'pcs')
    }
  }

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0)
  const { cgst, sgst, grand } = calcGST(subtotal)

  const handleSave = () => {
    onSave({
      id: order.id,
      items: items.map(i => ({
        ...i,
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) || 0,
      })),
      total_amount: subtotal,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, width: '95vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'var(--indigo-dim)', border: '1px solid var(--indigo-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>✎</div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Edit Order #{String(order.id).padStart(4, '0')}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              Modify items, quantities, and prices
            </p>
          </div>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '50vh', overflowY: 'auto', paddingRight: 4 }}>
          {items.map((item, idx) => (
            <div key={idx} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 14px',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Item Name</label>
                  <input className="bv-input" value={item.name}
                    onChange={e => handleNameChange(idx, e.target.value)}
                    placeholder="e.g. Rice Bag"
                    list={`inv-list-${idx}`}
                    style={{ fontSize: 13 }}
                  />
                  <datalist id={`inv-list-${idx}`}>
                    {Array.isArray(inventory) && inventory.map(inv => (
                      <option key={inv.id} value={inv.name}>{inv.name} — ₹{inv.price}/{inv.unit}</option>
                    ))}
                  </datalist>
                </div>
                <button onClick={() => removeItem(idx)} style={{
                  alignSelf: 'flex-end',
                  background: 'var(--rose-dim)', color: 'var(--rose)',
                  border: '1px solid var(--rose-border)', padding: '8px 12px',
                  borderRadius: 9, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600,
                }}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Qty</label>
                  <input className="bv-input" type="number" min="1" value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Price (₹)</label>
                  <input className="bv-input" type="number" min="0" value={item.price}
                    onChange={e => updateItem(idx, 'price', e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Unit</label>
                  <select className="bv-input" value={item.unit}
                    onChange={e => updateItem(idx, 'unit', e.target.value)}
                    style={{ fontSize: 13 }}
                  >
                    {['pcs', 'kg', 'g', 'L', 'ml', 'box', 'pack', 'dozen'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700, textAlign: 'right', marginTop: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                = ₹{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <button onClick={addItem} style={{
          marginTop: 10, width: '100%', padding: '10px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--border-mid)',
          color: 'var(--muted-light)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.15s',
        }}>+ Add Item</button>

        {/* Totals */}
        <div style={{
          marginTop: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '14px 16px',
        }}>
          {[
            { label: 'Subtotal',  value: `₹${subtotal.toFixed(2)}`,  color: 'var(--text-soft)' },
            { label: 'CGST (9%)', value: `₹${cgst.toFixed(2)}`, color: 'var(--indigo)' },
            { label: 'SGST (9%)', value: `₹${sgst.toFixed(2)}`, color: 'var(--indigo)' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
              <span style={{ color: 'var(--muted-light)' }}>{r.label}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: r.color, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>Grand Total</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: 'var(--teal)' }}>₹{grand.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saving...' : '✓ Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderDrawer({ order, onClose, onSendInvoice, onSendReminder, onEdit, sending, reminding }) {
  if (!order) return null
  const { sub, cgst, sgst, grand } = calcGST(order.total_amount)
  const date = parseUtc(order.created_at)

  const invoiceAge = order.invoice_sent_at
    ? Math.floor((Date.now() - new Date(order.invoice_sent_at)) / (1000 * 60 * 60))
    : null

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 40,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      }} />
      <div className="order-drawer" style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 50,
        width: 420, maxWidth: '100vw', background: '#141e2e',
        borderLeft: '1px solid var(--border-mid)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-24px 0 80px rgba(0,0,0,0.6)',
        animation: 'slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div>
            <p style={{ margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>
              #{String(order.id).padStart(4, '0')}
            </p>
            <h3 style={{ margin: '3px 0 0', fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Order Details
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {order.status === 'pending' && (
              <button onClick={() => onEdit(order)} style={{
                width: 34, height: 34, borderRadius: 9, border: '1px solid var(--indigo-border)',
                background: 'var(--indigo-dim)', color: 'var(--indigo)',
                cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }} title="Edit order">✎</button>
            )}
            <button onClick={onClose} style={{
              width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border-mid)',
              background: 'rgba(255,255,255,0.04)', color: 'var(--muted-light)',
              cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Status row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <StatusBadge status={order.status} />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}
              {date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Invoice age warning */}
          {order.status === 'invoiced' && invoiceAge !== null && invoiceAge > 24 && (
            <div style={{
              background: 'var(--amber-dim)', border: '1px solid var(--amber-border)',
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5,
            }}>
              <span>⏰</span>
              <span style={{ color: 'var(--amber)', fontWeight: 600 }}>
                Invoice sent {invoiceAge}h ago · Payment still pending
                {order.reminder_count > 0 && ` · ${order.reminder_count} reminder${order.reminder_count > 1 ? 's' : ''} sent`}
              </span>
            </div>
          )}

          {/* Customer */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
              Customer
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--teal), var(--indigo))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>{order.customer_phone?.slice(-2)}</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>
                  {order.customer_phone}
                </p>
                {order.language && (
                  <span style={{
                    fontSize: 10.5, padding: '2px 8px', borderRadius: 5, fontWeight: 700, textTransform: 'capitalize',
                    background: `${LANG_COLOR[order.language] || '#c87137'}18`,
                    color: LANG_COLOR[order.language] || '#c87137',
                    border: `1px solid ${LANG_COLOR[order.language] || '#c87137'}28`,
                  }}>{order.language}</span>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Items</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(order.items || []).map((item, i) => {
                const unitPrice = Number(item.price    || 0)
                const qty       = Number(item.quantity || 1)
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: i < (order.items || []).length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{item.name}</p>
                      {item.notes && <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--muted)' }}>{item.notes}</p>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-soft)', fontWeight: 600 }}>×{qty}</span>
                      {unitPrice > 0 && (
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--teal)', fontFamily: 'JetBrains Mono, monospace' }}>
                          ₹{(unitPrice * qty).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* GST Breakdown */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>GST Breakdown</p>
            {[
              { label: 'Subtotal',  value: `₹${sub.toFixed(2)}`,  color: 'var(--text-soft)' },
              { label: 'CGST (9%)', value: `₹${cgst.toFixed(2)}`, color: 'var(--indigo)' },
              { label: 'SGST (9%)', value: `₹${sgst.toFixed(2)}`, color: 'var(--indigo)' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--muted-light)' }}>{r.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: r.color, fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>Grand Total</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: 'var(--teal)' }}>₹{grand.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment link */}
          {order.payment_link && (
            <div style={{ background: 'var(--teal-dim)', border: '1px solid var(--teal-border)', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Payment Link</p>
              <a href={order.payment_link} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: 'var(--teal)', wordBreak: 'break-all', textDecoration: 'underline' }}>
                {order.payment_link}
              </a>
            </div>
          )}

          {/* Delivery Info */}
          {(['assigned', 'shipped', 'delivered'].includes(order.status)) && (
            <div style={{ background: 'var(--indigo-dim)', border: '1px solid var(--indigo-border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 10, color: 'var(--indigo)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                Delivery Tracking
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {order.delivery_agent_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>🛵</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{order.delivery_agent_name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Agent Assigned</p>
                    </div>
                  </div>
                )}
                {order.tracking_link && (
                  <a href={order.tracking_link} target="_blank" rel="noreferrer" className="btn-indigo"
                    style={{ width: '100%', justifyContent: 'center', padding: '10px', textDecoration: 'none', fontSize: 13 }}>
                    📍 Track Delivery
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Original message */}
          {order.raw_message && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Original Message</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted-light)', lineHeight: 1.6, fontStyle: 'italic' }}>"{order.raw_message}"</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {order.status === 'pending' && (
            <>
              <button className="btn-indigo" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => onEdit(order)}>
                ✎ Edit Order
              </button>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => onSendInvoice(order)} disabled={sending}>
                {sending ? '⏳ Sending…' : '📲 Send Invoice via WhatsApp'}
              </button>
            </>
          )}
          {order.status === 'invoiced' && (
            <button className="btn-indigo" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              onClick={() => onSendReminder(order)} disabled={reminding}>
              {reminding ? '⏳ Sending…' : '⏰ Send Payment Reminder'}
            </button>
          )}
          <a
            href={`https://wa.me/${order.customer_phone?.replace(/\D/g, '')}`}
            target="_blank" rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px', borderRadius: 11, textDecoration: 'none',
              background: 'var(--teal-dim)', color: 'var(--teal)',
              border: '1px solid var(--teal-border)', fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s',
            }}>
            💬 Open in WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}

export default function OrdersPage() {
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [sending, setSending]     = useState(false)
  const [reminding, setReminding] = useState(false)
  const [filter, setFilter]       = useState('all')
  const [search, setSearch]       = useState('')
  const [toast, setToast]         = useState(null)
  const [editOrder, setEditOrder] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [inventory, setInventory] = useState([])
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const intervalRef               = useRef(null)

  // FIX: useCallback so the interval always uses a stable reference
  const fetchOrders = useCallback(async () => {
    // Fetch inventory for price enrichment
    let inv = []
    try {
      const invRes = await fetch('/api/inventory')
      inv = await invRes.json()
      if (Array.isArray(inv)) setInventory(inv)
    } catch {}

    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      // 🔥 FIX: Enrich old orders that have price=0 with actual inventory prices
      const enriched = enrichOrdersWithPrices(data, Array.isArray(inv) ? inv : [])
      setOrders(enriched)
      // FIX: keep drawer in sync with live data
      setSelected(prev => prev ? (enriched.find(o => o.id === prev.id) ?? prev) : null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    intervalRef.current = setInterval(fetchOrders, 12000)
    return () => clearInterval(intervalRef.current)
  }, [fetchOrders])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  async function sendInvoice(order) {
    setSending(true)
    try {
      const res  = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, phone: order.customer_phone }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('📲 Invoice + payment link sent via WhatsApp!')
        setSelected(null)
        await fetchOrders()
      } else {
        showToast('Failed: ' + (data.error || 'Unknown error'), 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
    setSending(false)
  }

  async function sendReminder(order) {
    setReminding(true)
    try {
      const res  = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('⏰ Payment reminder sent!')
        setSelected(s => s ? { ...s, reminder_count: (s.reminder_count || 0) + 1 } : s)
        await fetchOrders()
      } else {
        showToast('Failed: ' + (data.error || 'Unknown error'), 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
    setReminding(false)
  }

  async function handleEditSave(updatedOrder) {
    setSaving(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      })
      const data = await res.json()
      if (data.success) {
        showToast('✓ Order updated successfully')
        setEditOrder(null)
        setSelected(null)
        await fetchOrders()
      } else {
        showToast('Failed: ' + (data.error || 'Unknown error'), 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
    setSaving(false)
  }

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      String(o.id).includes(q) ||
      o.customer_phone?.includes(q) ||
      (o.items || []).some(i => i.name?.toLowerCase().includes(q))
    return matchFilter && matchSearch
  })

  // Pagination logic
  const totalPages  = Math.ceil(filtered.length / rowsPerPage)
  const paginated   = (rowsPerPage === -1) 
    ? filtered 
    : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filter, rowsPerPage])

  const counts = {
    all:      orders.length,
    pending:  orders.filter(o => o.status === 'pending').length,
    invoiced: orders.filter(o => o.status === 'invoiced').length,
    paid:     orders.filter(o => o.status === 'paid').length,
  }

  const totalRevenue = orders
    .filter(o => o.status === 'paid')
    .reduce((s, o) => s + (Number(o.total_amount) || 0), 0)

  const overdueCount = orders.filter(o => {
    if (o.status !== 'invoiced' || !o.invoice_sent_at) return false
    return (Date.now() - new Date(o.invoice_sent_at)) > 24 * 60 * 60 * 1000
  }).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 'none' }} className="animate-fade-up">
      {/* Header */}
      <div className="orders-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.03em' }}>Orders</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
            <span className="live-dot" style={{ width: 7, height: 7, background: 'var(--teal)' }} />
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontWeight: 500 }}>Live · refreshes every 12s</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--teal)', margin: 0, letterSpacing: '-0.03em', fontFamily: 'JetBrains Mono, monospace' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Collected</p>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div style={{
          background: 'var(--amber-dim)', border: '1px solid var(--amber-border)',
          borderRadius: 12, padding: '12px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⏰</span>
            <span style={{ color: 'var(--amber)', fontWeight: 600, fontSize: 13 }}>
              {overdueCount} invoice{overdueCount > 1 ? 's' : ''} overdue — payment pending for 24h+
            </span>
          </div>
          <button
            onClick={() => setFilter('invoiced')}
            style={{
              background: 'var(--amber)', color: '#1a0e00', border: 'none',
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >View All</button>
        </div>
      )}

      {/* Stat pills */}
      <div className="stat-pills-grid" style={{ width: '100%' }}>
        {[
          { key: 'pending',  label: 'Pending',  ...STATUS_META.pending },
          { key: 'invoiced', label: 'Invoiced', ...STATUS_META.invoiced },
          { key: 'paid',     label: 'Paid',     ...STATUS_META.paid },
        ].map(s => (
          <div key={s.key}
            style={{
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 14, padding: '16px 20px', textAlign: 'center',
              cursor: 'pointer', transition: 'transform 0.15s',
            }}
            onClick={() => setFilter(s.key)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0, letterSpacing: '-0.03em', fontFamily: 'JetBrains Mono, monospace' }}>{counts[s.key]}</p>
            <p style={{ fontSize: 10.5, color: s.color, opacity: 0.8, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="search-filters-row" style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 14, pointerEvents: 'none' }}>⌕</span>
          <input className="bv-input" style={{ paddingLeft: 34 }}
            placeholder="Search by phone, item, or order #"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-tabs-wrap">
          {[
            { key: 'all',      label: 'All' },
            { key: 'pending',  label: 'Pending' },
            { key: 'invoiced', label: 'Invoiced' },
            { key: 'paid',     label: 'Paid' },
          ].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} className={`filter-tab ${filter === t.key ? 'active' : 'inactive'}`}>
              {t.label}
              {counts[t.key] > 0 && <span className="filter-count">{counts[t.key]}</span>}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Rows:</span>
          <select 
            value={rowsPerPage} 
            onChange={e => setRowsPerPage(Number(e.target.value))}
            style={{ 
              background: 'var(--card)', border: '1px solid var(--border)', 
              color: 'var(--text)', fontSize: 12, padding: '4px 8px', borderRadius: 8,
              outline: 'none', cursor: 'pointer'
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={-1}>All</option>
          </select>
        </div>
      </div>

      {/* Table & Mobile Card List Wrapper */}
      <div className="bv-table-container" style={{ width: '100%' }}>
        {loading ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.2 }}>◦</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--muted-light)', margin: '0 0 6px' }}>No orders found</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Orders come via WhatsApp automatically</p>
          </div>
        ) : (
          <>
            {/* Unified Table View (Scrollable on Mobile) */}
            <div className="bv-table-wrap" style={{ 
              background: 'var(--card)', 
              border: '1px solid var(--border)', 
              borderRadius: 16, 
              overflowX: 'auto',
              width: '100%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'auto',
              scrollbarColor: 'var(--teal) transparent'
            }}>
              <div className="mobile-only hint-text" style={{ padding: '8px 16px', background: 'var(--teal-dim)', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>
                ↔ Scroll horizontally to see all columns
              </div>
              <div className="bv-table-scroll" style={{ minWidth: 1000 }}>
                <table className="bv-table">
                  <thead>
                    <tr>
                      <th style={{ width: 80, minWidth: 80 }}>Order</th>
                      <th style={{ width: 140, minWidth: 140 }}>Customer</th>
                      <th style={{ minWidth: 150 }}>Items</th>
                      <th style={{ textAlign: 'right', width: 90, minWidth: 90 }}>Subtotal</th>
                      <th style={{ textAlign: 'right', width: 100, minWidth: 100 }}>w/ GST</th>
                      <th style={{ width: 110, minWidth: 110 }}>Status</th>
                      <th style={{ width: 100, minWidth: 100 }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                  {paginated.map(order => {
                    const { sub, grand } = calcGST(order.total_amount)
                    const date      = parseUtc(order.created_at)
                    const isToday   = new Date().toDateString() === date.toDateString()
                    const lang      = order.language || 'english'
                    const langColor = LANG_COLOR[lang] || '#c87137'
                    const isOverdue = order.status === 'invoiced' && order.invoice_sent_at &&
                      (Date.now() - new Date(order.invoice_sent_at)) > 24 * 60 * 60 * 1000

                    return (
                      <tr key={order.id} onClick={() => setSelected(order)} style={{ cursor: 'pointer' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: 'var(--muted-light)', fontWeight: 500 }}>
                              #{String(order.id).padStart(4, '0')}
                            </span>
                            {isOverdue && <span title="Payment overdue" style={{ fontSize: 12 }}>⏰</span>}
                          </div>
                        </td>
                        <td style={{ width: 180 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: 13, fontWeight: 800 }}>{order.customer_name || 'Anonymous'}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>{order.customer_phone}</p>
                              <span style={{ 
                                fontSize: 9, padding: '1px 5px', borderRadius: 4, fontWeight: 700, 
                                textTransform: 'uppercase', background: `${langColor}15`, color: langColor, border: `1px solid ${langColor}30` 
                              }}>{lang === 'hindi' ? 'हिं' : 'EN'}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ maxWidth: 220 }}>
                          <p className="line-clamp-1" style={{ margin: 0, fontSize: 12, color: 'var(--muted-light)' }}>
                            {(order.items || []).map(i => `${i.name} ×${i.quantity}`).join(' · ')}
                          </p>
                        </td>
                        <td style={{ textAlign: 'right', width: 110, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--muted-light)' }}>
                          ₹{sub.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', width: 110 }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>
                            ₹{grand.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ width: 110 }}><StatusBadge status={order.status} /></td>
                        <td style={{ width: 100, fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {isToday
                            ? date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
                            : date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    )
                  })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {filtered.length > 0 && rowsPerPage !== -1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            Showing <strong>{((currentPage - 1) * rowsPerPage) + 1}</strong> to <strong>{Math.min(currentPage * rowsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> orders
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn-ghost" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ padding: '6px 14px', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <button 
              className="btn-ghost" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ padding: '6px 14px', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <OrderDrawer
        order={selected}
        onClose={() => setSelected(null)}
        onSendInvoice={sendInvoice}
        onSendReminder={sendReminder}
        onEdit={(order) => { setSelected(null); setEditOrder(order) }}
        sending={sending}
        reminding={reminding}
      />

      {editOrder && (
        <EditOrderModal
          order={editOrder}
          inventory={inventory}
          onClose={() => setEditOrder(null)}
          onSave={handleEditSave}
          saving={saving}
        />
      )}

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