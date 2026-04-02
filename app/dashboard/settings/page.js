'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    business_name: '',
    logo_url: '',
    whatsapp_number: '',
    upi_id: '',
    invoice_footer: ''
  })

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (data) {
          setProfile(data)
        }
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('business_profiles')
      .upsert({ 
        user_id: user.id, 
        ...profile,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    setSaving(false)
    if (error) alert('Error saving profile: ' + error.message)
    else alert('Profile saved successfully!')
  }

  if (loading) return <div>Loading settings...</div>

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: '#fff' }}>Business Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Manage your business profile, invoicing details, and digital khata preferences.</p>
      </div>

      <form onSubmit={handleSave} style={{ background: 'var(--surface)', padding: 32, borderRadius: 16, border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 24px', color: '#fff' }}>Invoice & Branding</h2>
        
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>Business Name</label>
          <input type="text" value={profile.business_name || ''} onChange={e => setProfile({...profile, business_name: e.target.value})}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff' }} placeholder="e.g. Vaani Fresh Mart" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>Logo URL (Optional)</label>
          <input type="url" value={profile.logo_url || ''} onChange={e => setProfile({...profile, logo_url: e.target.value})}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff' }} placeholder="https://example.com/logo.png" />
          {profile.logo_url && <img src={profile.logo_url} alt="Logo Preview" style={{ marginTop: 12, height: 48, borderRadius: 8, objectFit: 'contain' }} />}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>WhatsApp Number</label>
          <input type="text" value={profile.whatsapp_number || ''} onChange={e => setProfile({...profile, whatsapp_number: e.target.value})}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff' }} placeholder="+91 98765 43210" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>UPI ID (For Payments)</label>
          <input type="text" value={profile.upi_id || ''} onChange={e => setProfile({...profile, upi_id: e.target.value})}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff' }} placeholder="yourname@bank" />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>Invoice Footer Text</label>
          <textarea value={profile.invoice_footer || ''} onChange={e => setProfile({...profile, invoice_footer: e.target.value})}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', minHeight: 80 }} placeholder="Thank you for your business!" />
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={saving}
            style={{ 
              background: 'linear-gradient(135deg, #00e5c3, #818cf8)', 
              color: '#000', fontWeight: 800, padding: '12px 24px', 
              borderRadius: 8, border: 'none', cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
