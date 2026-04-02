'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [savedAlert, setSavedAlert] = useState(false)
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
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile(data)
        }
      }
      setLoading(false)
    }
    loadProfile()
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
      setSavedAlert(true) // show success message
      window.dispatchEvent(new Event('profileUpdated'))

      // Hide success message after 2 seconds and stay on settings
      setTimeout(() => {
        setSavedAlert(false)
      }, 2000)
    }
  }

  if (loading) return <div style={{ padding: 40 }}>Loading settings...</div>
  if (savedAlert) return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,229,195,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e5c3' }}>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="32" height="32"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#fff' }}>Saved Successfully</h2>
      <p style={{ color: 'var(--muted)', margin: 0 }}>Updating your workspace...</p>
    </div>
  )

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Business Settings</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14.5, margin: 0 }}>Update your storefront details below.</p>
      </div>

      <form onSubmit={handleSave} style={{ background: 'var(--surface)', padding: 32, borderRadius: 16, border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 24px', color: '#fff' }}>Invoice & Branding</h2>

        {errorMsg && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.4)', borderRadius: 8, color: '#ff6b6b', fontSize: 14 }}>
            {errorMsg}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>Business Name</label>
          <input type="text" value={profile.business_name || ''} onChange={e => setProfile({ ...profile, business_name: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff' }} placeholder="e.g. BusinessVaani Fresh Mart" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>Business Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {profile.logo_url ? (
              <img src={profile.logo_url} alt="Logo Preview" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain', background: '#fff' }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--muted)' }}>Logo</div>
            )}
            <div style={{ flex: 1 }}>
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading}
                style={{ width: '100%', padding: '10px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', fontSize: 13 }} />
              {uploading && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--teal)' }}>Uploading image...</p>}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>WhatsApp Number</label>
          <input type="text" value={profile.whatsapp_number || ''} onChange={e => setProfile({ ...profile, whatsapp_number: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff' }} placeholder="+91 98765 43210" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>UPI ID (For Payments)</label>
          <input type="text" value={profile.upi_id || ''} onChange={e => setProfile({ ...profile, upi_id: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff' }} placeholder="yourname@bank" />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-light)', marginBottom: 8 }}>Invoice Footer Text</label>
          <textarea value={profile.invoice_footer || ''} onChange={e => setProfile({ ...profile, invoice_footer: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', minHeight: 80 }} placeholder="Thank you for your business!" />
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={saving || uploading}
            style={{
              background: 'linear-gradient(135deg, #00e5c3, #818cf8)',
              color: '#000', fontWeight: 800, padding: '12px 24px',
              borderRadius: 8, border: 'none', cursor: (saving || uploading) ? 'wait' : 'pointer',
              opacity: (saving || uploading) ? 0.7 : 1
            }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
