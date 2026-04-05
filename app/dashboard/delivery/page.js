'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'

const parseUtc = (ds) => !ds ? null : new Date(typeof ds === 'string' && !ds.endsWith('Z') && !ds.includes('+') ? ds + 'Z' : ds)

export default function DeliveryPage() {
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [agents, setAgents] = useState([])
  const [filter, setFilter] = useState('active') // 'active' or 'all'
  
  // Agent form state
  const [newAgent, setNewAgent] = useState({ name: '', phone: '' })
  const [addingAgent, setAddingAgent] = useState(false)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch profile
    const { data: prof } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    if (prof) setProfile(prof)
    else {
      // If profile doesn't exist, we'll create a stub one on first toggle
      setProfile({ id: user.id, has_delivery_partner: false })
    }

    // Fetch agents
    const { data: ags } = await supabase
      .from('delivery_agents')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: true })
    if (ags) setAgents(ags)

    // Fetch delivery orders
    const { data: ords } = await supabase
      .from('orders')
      .select('*')
      .not('delivery_status', 'is', null)
      .order('updated_at', { ascending: false })
    if (ords) setOrders(ords)

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 20000)
    return () => clearInterval(interval)
  }, [fetchData])

  const toggleDeliveryFeature = async () => {
    if (!profile) return
    setSaving(true)
    const newVal = !profile.has_delivery_partner
    
    const { error } = await supabase
      .from('business_profiles')
      .upsert({ 
        id: profile.id, 
        has_delivery_partner: newVal,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (!error) {
      setProfile({ ...profile, has_delivery_partner: newVal })
      window.dispatchEvent(new Event('profileUpdated'))
    } else {
      alert('Failed to update: ' + error.message)
    }
    setSaving(false)
  }

  const handleAddAgent = async (e) => {
    e.preventDefault()
    if (!newAgent.name || !newAgent.phone) return
    setAddingAgent(true)

    const { data, error } = await supabase
      .from('delivery_agents')
      .insert([{
        profile_id: profile.id,
        name: newAgent.name,
        phone: newAgent.phone.startsWith('+') ? newAgent.phone : `+91${newAgent.phone}`
      }])
      .select()

    if (!error) {
      setAgents([...agents, data[0]])
      setNewAgent({ name: '', phone: '' })
    } else {
      alert('Failed to add agent: ' + error.message)
    }
    setAddingAgent(false)
  }

  const handleDeleteAgent = async (id) => {
    if (!confirm('Are you sure you want to remove this partner?')) return
    
    const { error } = await supabase
      .from('delivery_agents')
      .delete()
      .eq('id', id)

    if (!error) {
      setAgents(agents.filter(a => a.id !== id))
    } else {
      alert('Failed to delete agent: ' + error.message)
    }
  }

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') return ['AWAITING_ADDRESS', 'CONFIRMED', 'PICKED'].includes(o.delivery_status)
    return true
  })

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading delivery management...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, overflow: 'hidden' }} className="animate-fade-up delivery-page">
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.03em' }}>
          Delivery Management
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0', fontWeight: 500 }}>
          Manage your own delivery fleet and track active orders.
        </p>
      </div>

      {/* Feature Toggle Card */}
      <div className="toggle-card" style={{
        background: profile?.has_delivery_partner ? 'var(--teal-dim)' : 'var(--surface)',
        border: `1px solid ${profile?.has_delivery_partner ? 'var(--teal-border)' : 'var(--border)'}`,
        borderRadius: 16, padding: '24px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap',
        transition: 'all 0.3s'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: profile?.has_delivery_partner ? 'var(--teal)' : 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            boxShadow: profile?.has_delivery_partner ? '0 8px 16px rgba(0, 229, 195, 0.2)' : 'none',
          }}>
            🚚
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              Own Delivery Partners
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted-light)' }}>
              Enable this to manage your own partners and track their status via WhatsApp.
            </p>
          </div>
        </div>
        
        <button 
          onClick={toggleDeliveryFeature} 
          disabled={saving}
          style={{
            background: profile?.has_delivery_partner ? 'var(--teal)' : 'var(--muted)',
            border: 'none', width: 64, height: 32, borderRadius: 20, flexShrink: 0,
            cursor: saving ? 'wait' : 'pointer', position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', top: 4, 
            left: profile?.has_delivery_partner ? 36 : 4,
            width: 24, height: 24, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {profile?.has_delivery_partner && (
        <div className="delivery-grid">
          
          {/* Main: Tracking Table */}
          <div className="tracking-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Active Tracking</h2>
              <div style={{ display: 'flex', background: 'var(--bg)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
                {['active', 'all'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '6px 12px', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 7, textTransform: 'capitalize',
                    background: filter === f ? 'var(--surface)' : 'transparent',
                    color: filter === f ? 'var(--text)' : 'var(--muted)',
                    cursor: 'pointer'
                  }}>{f}</button>
                ))}
              </div>
            </div>

            {/* Desktop Table */}
            <div className="desktop-only" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500, tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: 'var(--muted)', width: '30%' }}>Order</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: 'var(--muted)', width: '20%' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', color: 'var(--muted)', width: '25%' }}>Partner</th>
                    <th style={{ textAlign: 'right', padding: '14px 20px', color: 'var(--muted)', width: '25%' }}>Updated (IST)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>No orders in delivery lifecycle.</td></tr>
                  ) : (
                    filteredOrders.map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>#{String(o.id).padStart(4, '0')}</span>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>{o.customer_phone}</p>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                            background: o.delivery_status === 'DELIVERED' ? 'var(--teal-dim)' : 'var(--amber-dim)',
                            color: o.delivery_status === 'DELIVERED' ? 'var(--teal)' : 'var(--amber)',
                          }}>{o.delivery_status}</span>
                        </td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-soft)', fontWeight: 600 }}>{o.delivery_agent || '---'}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--muted)', fontSize: 11 }}>
                          <div>{parseUtc(o.updated_at || o.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}</div>
                          <div>{parseUtc(o.updated_at || o.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>

            {/* Mobile Card List */}
            <div className="mobile-only">
              {filteredOrders.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16 }}>
                  No orders in delivery lifecycle.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredOrders.map(o => (
                    <div key={o.id} style={{
                      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono', fontSize: 13 }}>#{String(o.id).padStart(4, '0')}</span>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>{o.customer_phone}</p>
                        </div>
                        <span style={{
                          padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                          background: o.delivery_status === 'DELIVERED' ? 'var(--teal-dim)' : 'var(--amber-dim)',
                          color: o.delivery_status === 'DELIVERED' ? 'var(--teal)' : 'var(--amber)',
                        }}>{o.delivery_status}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-soft)', fontWeight: 600 }}>🛵 {o.delivery_agent || '---'}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>
                          {parseUtc(o.updated_at || o.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}{', '}
                          {parseUtc(o.updated_at || o.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Partners Management */}
          <div className="management-section">
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 16px' }}>Manage Partners</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {agents.length === 0 ? (
                  <div style={{ 
                    padding: '20px 0', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12, background: 'rgba(255,255,255,0.01)'
                  }}>
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>No partners added yet.</p>
                  </div>
                ) : (
                  agents.map(a => (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)'
                    }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{a.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--muted-light)' }}>{a.phone}</p>
                      </div>
                      <button onClick={() => handleDeleteAgent(a.id)} style={{
                        background: 'rgba(255, 71, 87, 0.1)', border: 'none', color: '#ff4757', cursor: 'pointer', 
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 400
                      }}>×</button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddAgent} style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', margin: 0 }}>Add New Partner</p>
                <input 
                  placeholder="Partner Name" className="bv-input" value={newAgent.name}
                  onChange={e => setNewAgent({ ...newAgent, name: e.target.value })}
                  style={{ fontSize: 13 }}
                />
                <input 
                  placeholder="WhatsApp (e.g. 9876543210)" className="bv-input" value={newAgent.phone}
                  onChange={e => setNewAgent({ ...newAgent, phone: e.target.value })}
                  style={{ fontSize: 13 }}
                />
                <button type="submit" className="btn-primary" disabled={addingAgent} style={{ width: '100%', padding: 12, fontSize: 13 }}>
                  {addingAgent ? '⏳ Adding...' : 'Add Partner'}
                </button>
              </form>
            </div>

            <div style={{ padding: '0 8px' }}>
              <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                💡 Partners will receive a WhatsApp notification when an order is assigned to them. They can reply with <b>PICKED</b> or <b>DELIVERED</b> to update status.
              </p>
            </div>
          </div>
          
        </div>
      )}

      <style jsx>{`
        .animate-fade-up { animation: fadeUp 0.4s ease-out; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .delivery-grid {
          display: flex;
          flex-direction: row;
          gap: 24px;
          align-items: start;
        }
        
        .tracking-section { flex: 1; min-width: 0; overflow: hidden; }
        .management-section { width: 340px; flex-shrink: 0; transition: all 0.3s; }

        @media (max-width: 1100px) {
          .delivery-grid { flex-direction: column; gap: 16px; }
          .management-section { width: 100%; order: -1; }
        }

        @media (max-width: 768px) {
          .delivery-page { gap: 16px !important; max-width: 100%; }
          .toggle-card { padding: 16px !important; gap: 12px !important; }
          .delivery-grid { width: 100% !important; max-width: 100% !important; }
          .tracking-section { width: 100% !important; max-width: 100% !important; }
          .management-section { width: 100% !important; }
          .management-section > div { padding: 14px !important; }
        }

        .bv-input { width: 100%; padding: 10px 14px; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; color: var(--text); outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .bv-input:focus { border-color: var(--indigo); }
        .btn-primary { background: var(--indigo); color: #fff; border: none; padding: 10px 16px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
