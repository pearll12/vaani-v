'use client'
import { useEffect, useState, useRef, useMemo } from 'react'

const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'box', 'pack', 'dozen']
const CATS  = ['General', 'Food & Grocery', 'Electronics', 'Clothing', 'Stationery', 'Home & Kitchen', 'Other']

const CAT_META = {
  'General':         { color: '#8498b4', bg: 'rgba(132,152,180,0.12)' },
  'Food & Grocery':  { color: '#a3e635', bg: 'rgba(163,230,53,0.12)' },
  'Electronics':     { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  'Clothing':        { color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  'Stationery':      { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'Home & Kitchen':  { color: '#fb7185', bg: 'rgba(251,113,133,0.12)' },
  'Other':           { color: '#c87137', bg: 'rgba(200,113,55,0.12)' },
}

function Modal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || {
    name: '', sku: '', category: 'General', quantity: '', unit: 'pcs', price: '', lowStockThreshold: 10
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isEdit = !!item?.id

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: isEdit ? 'var(--indigo-dim)' : 'var(--teal-dim)',
              border: `1px solid ${isEdit ? 'var(--indigo-border)' : 'var(--teal-border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {isEdit ? '✎' : '+'}
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                {isEdit ? 'Edit Item' : 'Add Item'}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                {isEdit ? `Editing ${item.name}` : 'Add a new inventory item'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, color: 'var(--muted-light)', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Item Name *</label>
              <input className="bv-input" type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Basmati Rice Premium" />
            </div>
            {[
              { label: 'SKU', key: 'sku', type: 'text', placeholder: 'e.g. SKU-001' },
              { label: 'Price (₹)', key: 'price', type: 'number', placeholder: '0.00' },
              { label: 'Quantity', key: 'quantity', type: 'number', placeholder: '0' },
              { label: 'Low Stock Alert', key: 'lowStockThreshold', type: 'number', placeholder: '10' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: 'var(--muted-light)', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{f.label}</label>
                <input className="bv-input" type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted-light)', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Unit</label>
              <select className="bv-input" value={form.unit} onChange={e => set('unit', e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted-light)', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Category</label>
              <select className="bv-input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(form)}>
            {isEdit ? 'Save Changes' : '+ Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CSVUploadModal({ onClose, onImport }) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview]   = useState(null)
  const [rows, setRows]         = useState([])
  const [error, setError]       = useState('')
  const fileRef = useRef()

  function parseCSV(text) {
    const lines = text.trim().split('\n')
    if (lines.length < 2) { setError('CSV must have a header row + data rows'); return }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ''))
    const parsed = lines.slice(1).map((line, i) => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj  = {}
      headers.forEach((h, idx) => { obj[h] = vals[idx] || '' })
      return {
        name:              obj.name || obj.item || obj.product || `Item ${i + 1}`,
        sku:               obj.sku || obj.code || '',
        category:          CATS.includes(obj.category) ? obj.category : 'General',
        quantity:          Number(obj.quantity || obj.qty || obj.stock || 0),
        unit:              UNITS.includes(obj.unit) ? obj.unit : 'pcs',
        price:             Number(obj.price || obj.rate || obj.cost || 0),
        lowStockThreshold: Number(obj.lowstockthreshold || obj.threshold || obj.reorder || 10),
      }
    }).filter(r => r.name)
    setRows(parsed)
    setPreview(true)
    setError('')
  }

  function handleFile(file) {
    if (!file || !file.name.endsWith('.csv')) { setError('Please upload a .csv file'); return }
    const reader = new FileReader()
    reader.onload = e => parseCSV(e.target.result)
    reader.readAsText(file)
  }

  const handleDrop = e => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: preview ? 640 : 480 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'var(--lime-dim)', border: '1px solid var(--lime-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>📊</div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Import via CSV</h2>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Upload a spreadsheet to bulk-add inventory</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {!preview ? (
            <>
              <div
                className={`drop-zone ${dragging ? 'drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal)', margin: '0 0 6px' }}>
                  Drop CSV here or click to browse
                </p>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                  Supports columns: name, sku, category, quantity, unit, price, lowStockThreshold
                </p>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])} />
              </div>

              <div style={{
                marginTop: 16, padding: '12px 14px', borderRadius: 10,
                background: 'var(--indigo-dim)', border: '1px solid var(--indigo-border)',
                fontSize: 12, color: 'var(--indigo)', fontFamily: 'JetBrains Mono, monospace',
              }}>
                name,sku,category,quantity,unit,price,lowStockThreshold
              </div>
              {error && (
                <p style={{ color: 'var(--rose)', fontSize: 12.5, marginTop: 12, fontWeight: 600 }}>⚠ {error}</p>
              )}
            </>
          ) : (
            <>
              <div style={{
                background: 'var(--teal-dim)', border: '1px solid var(--teal-border)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
              }}>
                <span style={{ fontSize: 16 }}>✓</span>
                <span style={{ color: 'var(--teal)', fontWeight: 600 }}>
                  Found {rows.length} items ready to import
                </span>
              </div>

              <div className="bv-table-wrap" style={{ borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
                <table className="bv-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 14px' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '12px 14px' }}>SKU</th>
                      <th style={{ textAlign: 'left', padding: '12px 14px' }}>Category</th>
                      <th style={{ textAlign: 'right', padding: '12px 14px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '12px 14px' }}>Price (₹)</th>
                      {rows.length > 0 && Object.keys(rows[0]).filter(k => !['name','sku','category','quantity','unit','price','lowStockThreshold'].includes(k)).map(key => (
                        <th key={key} style={{ textAlign: 'left', padding: '12px 14px', textTransform: 'capitalize' }}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const cm = CAT_META[r.category] || CAT_META.General
                      const extras = Object.keys(r).filter(k => !['name','sku','category','quantity','unit','price','lowStockThreshold'].includes(k))
                      return (
                        <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ fontWeight: 600, color: 'var(--text)', padding: '12px 14px' }}>{r.name}</td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: 'var(--muted-light)', padding: '12px 14px' }}>{r.sku || '—'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: cm.bg, color: cm.color }}>
                              {r.category}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, padding: '12px 14px' }}>{r.quantity}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', padding: '12px 14px' }}>₹{r.price}</td>
                          {extras.map(ex => (
                            <td key={ex} style={{ padding: '12px 14px', color: 'var(--muted-light)', fontSize: 13 }}>{r[ex]}</td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          {preview && (
            <>
              <button className="btn-ghost" onClick={() => { setPreview(false); setRows([]) }}>← Re-upload</button>
              <button className="btn-primary" onClick={() => onImport(rows)}>
                ⬆ Import {rows.length} Items
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)
  const [csvModal, setCsvModal]   = useState(false)
  const [search, setSearch]       = useState('')
  const [toast, setToast]         = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const customColumns = useMemo(() => {
    const cols = new Set()
    items.forEach(i => {
      if (i.custom_data) {
        Object.keys(i.custom_data).forEach(k => cols.add(k))
      }
    })
    return Array.from(cols)
  }, [items])

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch('/api/inventory')
    setItems(await res.json())
    setLoading(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2800) }

  async function handleSave(form) {
    const isEdit = !!form.id
    await fetch('/api/inventory', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setModal(null)
    await load()
    showToast(isEdit ? '✓ Item updated' : '✓ Item added')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this item?')) return
    await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' })
    await load()
    showToast('🗑 Item deleted')
  }

  async function handleCSVImport(rows) {
    let imported = 0
    for (const row of rows) {
      try {
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row),
        })
        imported++
      } catch {}
    }
    setCsvModal(false)
    await load()
    showToast(`✓ Imported ${imported} items from CSV`)
  }

  const cats = ['all', ...new Set(items.map(i => i.category).filter(Boolean))]

  const filtered = items.filter(i => {
    const matchSearch = !search ||
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.sku?.toLowerCase().includes(search.toLowerCase()) ||
      i.category?.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'all' || i.category === catFilter
    return matchSearch && matchCat
  })

  // Pagination logic
  const totalPages  = Math.ceil(filtered.length / rowsPerPage)
  const paginated   = (rowsPerPage === -1) 
    ? filtered 
    : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, catFilter, rowsPerPage])

  const totalValue = items.reduce((s, i) => s + (Number(i.price) * Number(i.quantity)), 0)
  const lowStock   = items.filter(i => Number(i.quantity) <= Number(i.lowStockThreshold))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.03em' }}>Inventory</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0', fontWeight: 500 }}>
            {items.length} items ·{' '}
            <span style={{ color: 'var(--teal)' }}>₹{totalValue.toLocaleString('en-IN')}</span> stock value
            {lowStock.length > 0 && <span style={{ color: 'var(--rose)' }}> · {lowStock.length} low stock</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={() => setCsvModal(true)}>
            <span>📊</span> Import CSV
          </button>
          <button className="btn-primary" onClick={() => setModal('new')}>
            + Add Item
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {[
          {
            label: 'Total Items', value: items.length, icon: '⬡',
            color: 'var(--sky)', bg: 'var(--sky-dim)', border: 'var(--sky-border)',
          },
          {
            label: 'Stock Value', value: `₹${totalValue.toLocaleString('en-IN')}`, icon: '◈',
            color: 'var(--teal)', bg: 'var(--teal-dim)', border: 'var(--teal-border)',
          },
          {
            label: 'Low Stock Alerts', value: lowStock.length, icon: '⚠',
            color: lowStock.length > 0 ? 'var(--rose)' : 'var(--muted-light)',
            bg: lowStock.length > 0 ? 'var(--rose-dim)' : 'rgba(255,255,255,0.03)',
            border: lowStock.length > 0 ? 'var(--rose-border)' : 'var(--border)',
          },
        ].map(k => (
          <div key={k.label} style={{
            background: k.bg, border: `1px solid ${k.border}`,
            borderRadius: 16, padding: '20px 24px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: 16, top: 16, fontSize: 24, opacity: 0.15, color: k.color }}>
              {k.icon}
            </div>
            <p style={{ fontSize: 10.5, color: k.color, opacity: 0.85, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{k.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: k.color, margin: 0, letterSpacing: '-0.03em', fontFamily: 'JetBrains Mono, monospace' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Low stock banner */}
      {lowStock.length > 0 && (
        <div style={{
          background: 'var(--rose-dim)', border: '1px solid var(--rose-border)',
          borderRadius: 12, padding: '12px 18px',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
        }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          <span style={{ color: '#fca5a5', fontWeight: 500 }}>
            Low stock:&nbsp;
            {lowStock.map((i, idx) => (
              <span key={i.id}>
                <strong style={{ color: 'var(--rose)' }}>{i.name}</strong>
                {' '}
                <span style={{ color: 'var(--muted)', fontSize: 11 }}>({i.quantity} {i.unit})</span>
                {idx < lowStock.length - 1 && <span style={{ color: 'var(--muted)', margin: '0 6px' }}>·</span>}
              </span>
            ))}
          </span>
        </div>
      )}

      {/* Search + Category filter */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: 340 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 14, pointerEvents: 'none' }}>⌕</span>
          <input
            className="bv-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search items, SKUs, categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} className={`filter-tab ${catFilter === c ? 'active' : 'inactive'}`} style={{ fontSize: 12 }}>
              {c === 'all' ? 'All' : c}
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
      <div className="bv-table-container">
        {loading ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.2 }}>⬡</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--muted-light)', margin: '0 0 8px' }}>
              {search ? 'No items match your search' : 'No items yet'}
            </p>
            <p style={{ fontSize: 13, margin: '0 0 20px' }}>
              {search ? 'Try a different search term' : 'Add items manually or import a CSV to get started'}
            </p>
            {!search && (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-ghost" onClick={() => setCsvModal(true)}>📊 Import CSV</button>
                <button className="btn-primary" onClick={() => setModal('new')}>+ Add Item</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="desktop-only">
              <div className="bv-table-wrap">
                <table className="bv-table">
                  <thead>
                    <tr>
                      <th style={{ width: 220 }}>Item Name</th>
                      <th className="mobile-hide" style={{ width: 140 }}>Category</th>
                      <th className="mobile-hide" style={{ width: 120 }}>SKU</th>
                      <th style={{ width: 110, textAlign: 'right' }}>Price</th>
                      <th style={{ width: 100, textAlign: 'right' }}>Qty</th>
                      <th style={{ width: 130, textAlign: 'right' }}>Stock Value</th>
                      {customColumns.map(col => (
                        <th key={col} style={{ textTransform: 'capitalize' }}>{col.replace(/_/g, ' ')}</th>
                      ))}
                      <th style={{ width: 120 }}>Status</th>
                      <th style={{ width: 160 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(item => {
                      const low = Number(item.quantity) <= Number(item.lowStockThreshold)
                      const cm  = CAT_META[item.category] || CAT_META.General
                      return (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13.5 }}>{item.name}</span>
                              <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{item.sku || 'No SKU'}</span>
                            </div>
                          </td>
                          <td className="mobile-hide">
                            <span style={{
                              fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 700,
                              background: cm.bg, color: cm.color, border: `1px solid ${cm.color}20`
                            }}>{item.category}</span>
                          </td>
                          <td className="mobile-hide">
                            <code style={{ fontSize: 11.5, color: 'var(--muted-light)' }}>{item.sku || '—'}</code>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>₹{Number(item.price).toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: low ? 'var(--rose)' : 'var(--teal)' }}>
                              {item.quantity}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>{item.unit}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-dim)' }}>₹{(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}</td>
                          {customColumns.map(col => (
                            <td key={col} style={{ color: 'var(--muted-light)', fontSize: 13 }}>
                              {(item.custom_data && item.custom_data[col]) ? String(item.custom_data[col]) : '—'}
                            </td>
                          ))}
                          <td><span className={`badge ${low ? 'badge-low' : 'badge-ok'}`}>{low ? 'Low Stock' : 'In Stock'}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setModal(item)}>Edit</button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                style={{
                                  background: 'rgba(244, 96, 123, 0.08)', color: '#f4607b',
                                  border: '1px solid rgba(244, 96, 123, 0.2)', padding: '6px 12px',
                                  borderRadius: 10, fontSize: 12, cursor: 'pointer',
                                  fontWeight: 700, transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(244, 96, 123, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(244, 96, 123, 0.08)'}
                              >Delete</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile card list */}
            <div className="mobile-only" style={{ padding: '0px' }}>
              <div className="card-list-mobile">
                {paginated.map(item => {
                  const low = Number(item.quantity) <= Number(item.lowStockThreshold)
                  const cm  = CAT_META[item.category] || CAT_META.General
                  return (
                    <div key={item.id} className="mobile-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{item.name}</h4>
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{item.sku || 'No SKU'}</p>
                        </div>
                        <span style={{ 
                          fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 800,
                          background: cm.bg, color: cm.color, border: `1px solid ${cm.color}25`
                        }}>{item.category}</span>
                      </div>

                      <div className="mobile-card-row" style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div>
                          <p className="mobile-card-label" style={{ fontSize: 9 }}>Price</p>
                          <p className="mobile-card-value" style={{ fontSize: 15, color: 'var(--emerald)', fontWeight: 700 }}>₹{Number(item.price).toLocaleString('en-IN')}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p className="mobile-card-label" style={{ fontSize: 9 }}>Qty left</p>
                          <p className="mobile-card-value" style={{ fontSize: 14, fontWeight: 700, color: low ? 'var(--rose)' : 'var(--teal)' }}>
                            {item.quantity} <span style={{ fontSize: 10, opacity: 0.6 }}>{item.unit}</span>
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button className="btn-ghost" style={{ flex: 1, padding: '8px' }} onClick={() => setModal(item)}>Edit</button>
                        <button 
                          className="btn-ghost" 
                          style={{ flex: 1, color: 'var(--rose)', borderColor: 'rgba(225,29,72,0.2)', padding: '8px' }}
                          onClick={() => { if(confirm('Delete item?')) handleDelete(item.id) }}
                        >Delete</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {filtered.length > 0 && rowsPerPage !== -1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            Showing <strong>{((currentPage - 1) * rowsPerPage) + 1}</strong> to <strong>{Math.min(currentPage * rowsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> items
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

      {modal && <Modal item={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
      {csvModal && <CSVUploadModal onClose={() => setCsvModal(false)} onImport={handleCSVImport} />}

      {toast && (
        <div className="toast">
          <span style={{ fontSize: 16 }}>📦</span>
          {toast}
        </div>
      )}
    </div>
  )
}
