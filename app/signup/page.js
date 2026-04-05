'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// ── Brand phone illustration (same as login) ─────────────────────────────────
function PhoneIllustration() {
  return (
    <svg viewBox="0 0 260 420" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 220, filter: 'drop-shadow(0 32px 48px rgba(0,0,0,0.35))' }}>
      <rect x="10" y="10" width="240" height="400" rx="32" fill="#1A0C04" />
      <rect x="10" y="10" width="240" height="400" rx="32" stroke="#3D1F0A" strokeWidth="2" />
      <rect x="24" y="50" width="212" height="330" rx="16" fill="#F5EDE0" />
      <rect x="100" y="24" width="60" height="10" rx="5" fill="#0D0603" />
      <rect x="95" y="398" width="70" height="5" rx="2.5" fill="#3D1F0A" />
      <rect x="24" y="50" width="212" height="44" rx="0" fill="#2A7A4F" />
      <rect x="24" y="50" width="212" height="8" rx="0" fill="#2A7A4F" />
      <circle cx="52" cy="72" r="14" fill="#FDF4E8" />
      <rect x="44" y="66" width="16" height="14" rx="2" fill="#C24B2A" />
      <rect x="42" y="64" width="20" height="4" rx="1" fill="#3D1F0A" />
      <rect x="46" y="70" width="4" height="4" rx="1" fill="#FDF4E8" />
      <rect x="54" y="70" width="4" height="4" rx="1" fill="#FDF4E8" />
      <rect x="73" y="66" width="72" height="7" rx="3.5" fill="#ffffff" opacity="0.9" />
      <rect x="73" y="77" width="48" height="5" rx="2.5" fill="#ffffff" opacity="0.5" />

      {/* Setup msgs — first-time onboarding feel */}
      {/* System message */}
      <rect x="56" y="104" width="148" height="24" rx="8" fill="#D4C4B0" opacity="0.5" />
      <rect x="80" y="112" width="100" height="6" rx="3" fill="#8A7060" opacity="0.6" />

      {/* Incoming */}
      <rect x="32" y="140" width="148" height="52" rx="12" fill="#ffffff" />
      <polygon points="32,162 18,172 36,162" fill="#ffffff" />
      <rect x="42" y="151" width="116" height="8" rx="4" fill="#3D1F0A" opacity="0.7" />
      <rect x="42" y="165" width="86" height="6" rx="3" fill="#3D1F0A" opacity="0.35" />
      <rect x="42" y="177" width="52" height="5" rx="2.5" fill="#3D1F0A" opacity="0.2" />

      {/* Outgoing with invoice badge */}
      <rect x="64" y="206" width="172" height="80" rx="12" fill="#C24B2A" />
      <polygon points="236,250 250,260 232,250" fill="#C24B2A" />
      {/* invoice badge inside */}
      <rect x="74" y="214" width="80" height="30" rx="6" fill="#FDF4E8" opacity="0.18" />
      <rect x="80" y="220" width="52" height="6" rx="3" fill="#ffffff" opacity="0.9" />
      <rect x="80" y="230" width="36" height="5" rx="2.5" fill="#ffffff" opacity="0.55" />
      {/* price text */}
      <rect x="164" y="222" width="48" height="10" rx="5" fill="#D4860E" />
      <rect x="74" y="252" width="120" height="7" rx="3.5" fill="#ffffff" opacity="0.55" />
      <rect x="74" y="265" width="84" height="6" rx="3" fill="#ffffff" opacity="0.35" />
      <path d="M210,273 L218,281 L232,265" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <path d="M203,273 L210,281" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.55" />

      {/* Incoming ack */}
      <rect x="32" y="300" width="100" height="36" rx="12" fill="#ffffff" />
      <polygon points="32,318 18,328 36,318" fill="#ffffff" />
      <rect x="42" y="312" width="72" height="8" rx="4" fill="#3D1F0A" opacity="0.7" />
      <rect x="42" y="324" width="48" height="6" rx="3" fill="#3D1F0A" opacity="0.35" />

      {/* Typing indicator */}
      <rect x="32" y="350" width="56" height="28" rx="12" fill="#ffffff" />
      <circle cx="44" cy="364" r="4" fill="#C4B4A4" />
      <circle cx="56" cy="364" r="4" fill="#C4B4A4" opacity="0.6" />
      <circle cx="68" cy="364" r="4" fill="#C4B4A4" opacity="0.3" />

      {/* Type bar */}
      <rect x="24" y="356" width="212" height="24" rx="0" fill="#ECDFD4" />
      <rect x="32" y="361" width="140" height="12" rx="6" fill="#D4C4B0" />
      <circle cx="220" cy="368" r="10" fill="#2A7A4F" />
      <rect x="216" y="362" width="8" height="10" rx="4" fill="#ffffff" />
      <path d="M213,369 Q213,376 220,376 Q227,376 227,369" stroke="#ffffff" strokeWidth="1.5" fill="none" />
      <line x1="220" y1="376" x2="220" y2="380" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  )
}

function BrandPanel({ subtitle }) {
  return (
    <div style={{
      flex: 1, background: '#3D1F0A',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 40px', position: 'relative', overflow: 'hidden',
      minHeight: 480,
    }}>
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,134,14,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -60, left: -60,
        width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,75,42,0.22) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ marginBottom: 36, textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#C24B2A', textTransform: 'uppercase', marginBottom: 10 }}>
          Run your shop.
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1, color: '#FDF4E8' }}>
          Business<span style={{ color: '#D4860E' }}>Vaani</span>
        </div>
      </div>
      <div style={{ zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <PhoneIllustration />
      </div>
      <p style={{ marginTop: 32, fontSize: 13, color: '#9A7860', textAlign: 'center', maxWidth: 240, lineHeight: 1.6, zIndex: 1 }}>
        {subtitle}
      </p>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const { error: err } = await supabase.auth.signUp({ email, password })
    if (err) { setError(err.message); setLoading(false) }
    else {
      setSuccess('Account created! Taking you to your dashboard…')
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  }

  async function signInWithGoogle() {
    setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    })
    if (err) setError(err.message)
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    background: '#FDFCFB', border: '1.5px solid #EADDCF',
    borderRadius: 12, color: '#2D241E', fontSize: 15,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#C24B2A', marginBottom: 7,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      background: '#FDF4E8',
    }}>
      {/* ── Left visual panel ── */}
      <div style={{ flex: '0 0 440px', display: 'none' }} className="brand-panel-desktop">
        <BrandPanel subtitle="Auto-generate invoices, take payments, reply to orders — all from WhatsApp." />
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', position: 'relative', overflow: 'hidden',
        minHeight: '100vh',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 80% 10%, rgba(212,134,14,0.10) 0%, transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(194,75,42,0.08) 0%, transparent 55%)',
        }} />

        <Link href="/" style={{
          position: 'absolute', top: 28, left: 28,
          color: '#C24B2A', display: 'flex', alignItems: 'center', gap: 6,
          textDecoration: 'none', fontSize: 13, fontWeight: 700, zIndex: 10,
        }}>
          <ArrowLeft size={15} /> Back
        </Link>

        <div style={{ width: '100%', maxWidth: 380, zIndex: 1 }}>
          {/* Mobile logo - Hidden on Desktop to prevent duplication */}
          <div className="mobile-logo-only" style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#C24B2A', textTransform: 'uppercase', marginBottom: 6 }}>
              Run your shop.
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: '#3D1F0A' }}>
              Business<span style={{ color: '#C24B2A' }}>Vaani</span>
            </div>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.5px', color: '#2D241E' }}>
            Set up your store
          </h2>
          <p style={{ fontSize: 14, color: '#9A7860', marginBottom: 28 }}>
            Free to start. No credit card needed.
          </p>

          {error && (
            <div style={{
              background: '#FEF2F2', color: '#B91C1C',
              border: '1px solid #FEE2E2', padding: '11px 14px',
              borderRadius: 10, fontSize: 13, marginBottom: 20,
              fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#F0FDF4', color: '#16A34A',
              border: '1px solid #DCFCE7', padding: '11px 14px',
              borderRadius: 10, fontSize: 13, marginBottom: 20,
              fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>✓</span> {success}
            </div>
          )}

          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#C24B2A'}
                onBlur={e => e.target.style.borderColor = '#EADDCF'}
                required
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password" placeholder="Min. 6 characters"
                value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#C24B2A'}
                onBlur={e => e.target.style.borderColor = '#EADDCF'}
                required minLength={6}
              />
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', background: loading ? '#9A7860' : '#C24B2A',
                color: '#FDF4E8', fontSize: 15, fontWeight: 700, padding: '14px 0',
                borderRadius: 12, border: 'none', cursor: loading ? 'wait' : 'pointer',
                letterSpacing: '-0.2px', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#A33D22' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#C24B2A' }}
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#EADDCF' }} />
            <span style={{ fontSize: 12, color: '#C4B4A4', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#EADDCF' }} />
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            style={{
              width: '100%', background: '#fff', border: '1.5px solid #EADDCF',
              color: '#3D1F0A', fontSize: 14, fontWeight: 700, padding: '12px 0',
              borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10, transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F9F6F3'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          {/* Trust badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 24 }}>
            {['Built for India', '10+ Languages', 'Free to start'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2A7A4F' }} />
                <span style={{ fontSize: 11, color: '#9A7860', fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 20, fontSize: 13, color: '#9A7860', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#C24B2A', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @media (min-width: 768px) {
          .brand-panel-desktop { display: flex !important; flex: 0 0 440px !important; }
          .mobile-logo-only { display: none !important; }
        }
      `}</style>
    </div>
  )
}