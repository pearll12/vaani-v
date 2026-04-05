'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/theme'

export default function SettingsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [toast, setToast] = useState(null)
  const [profile, setProfile] = useState({
    business_name: '',
    logo_url: '',
    whatsapp_number: '',
    upi_id: '',
    invoice_footer: ''
  })

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  useEffect(() => {
    async function initLoadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile(data)
        }
      }
      setLoading(false)
    }
    initLoadProfile()
  }, [])

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const fileName = `${user.id}-${Date.now()}`
    const { data, error } = await supabase.storage.from('logos').upload(fileName, file, { upsert: true })
    if (error) {
      alert('Upload failed: ' + error.message)
      setUploading(false)
      return
    }
    const { data: publicData } = supabase.storage.from('logos').getPublicUrl(fileName)
    setProfile(p => ({ ...p, logo_url: publicData.publicUrl }))
    setUploading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg('User not authenticated. Please log in again.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('business_profiles')
      .upsert({
        id: user.id,
        ...profile,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    setSaving(false)

    if (error) {
      console.error('Supabase save error:', error)
      setErrorMsg('Error saving profile: ' + error.message)
    } else {
      setToast('✅ Settings saved successfully!')
      window.dispatchEvent(new Event('profileUpdated'))
      router.refresh()

      // Refresh local state
      const { data: updated } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (updated) setProfile(updated)
    }
  }

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
      <div className="skeleton" style={{ width: 300, height: 400, borderRadius: 16 }} />
    </div>
  )

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--text)' }}>Business Settings</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14.5, margin: 0 }}>Update your storefront details below.</p>
      </div>

      {/* FIX 1: onKeyDown blocks Enter from submitting the form */}
      <form
        onSubmit={handleSave}
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
        style={{ background: 'var(--surface)', padding: 32, borderRadius: 16, border: '1px solid var(--border)' }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 24px', color: 'var(--text)' }}>Invoice & Branding</h2>

        {errorMsg && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.4)', borderRadius: 8, color: '#ff6b6b', fontSize: 14 }}>
            {errorMsg}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>Business Name</label>
          <input type="text" value={profile.business_name || ''} onChange={e => setProfile({ ...profile, business_name: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} placeholder="e.g. BusinessVaani Fresh Mart" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>Business Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <img
                src={profile.logo_url || "/logo1.png"}
                alt="Logo Preview"
                onError={(e) => e.target.src = "/logo1.png"}
                style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'contain', background: 'var(--bg)', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading}
                style={{ width: '100%', padding: '10px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }} />
              {uploading && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--teal)' }}>Uploading image...</p>}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>WhatsApp Number</label>
          <input type="text" value={profile.whatsapp_number || ''} onChange={e => setProfile({ ...profile, whatsapp_number: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} placeholder="+91 98765 43210" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>UPI ID (For Payments)</label>
          <input type="text" value={profile.upi_id || ''} onChange={e => setProfile({ ...profile, upi_id: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} placeholder="yourname@bank" />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>Invoice Footer Text</label>
          <textarea value={profile.invoice_footer || ''} onChange={e => setProfile({ ...profile, invoice_footer: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', minHeight: 80 }} placeholder="Thank you for your business!" />
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={saving || uploading}
            style={{
              background: theme === 'dark' ? 'linear-gradient(135deg, #00e5c3, #818cf8)' : 'linear-gradient(135deg, #c87137, #d98d5e)',
              color: theme === 'dark' ? '#000' : '#fff', fontWeight: 800, padding: '12px 24px',
              borderRadius: 8, border: 'none', cursor: (saving || uploading) ? 'wait' : 'pointer',
              opacity: (saving || uploading) ? 0.7 : 1
            }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {toast && (
        <div className="toast">
          <span style={{ fontSize: 16 }}>⚙️</span>
          {toast}
        </div>
      )}
    </div>
  )
}