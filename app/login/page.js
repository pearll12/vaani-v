'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// ── Brand phone illustration ──────────────────────────────────────────────────
function PhoneIllustration() {
  return (
    <svg viewBox="0 0 260 420" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 220, filter: 'drop-shadow(0 32px 48px rgba(0,0,0,0.35))' }}>
      {/* Phone body */}
      <rect x="10" y="10" width="240" height="400" rx="32" fill="#1A0C04" />
      <rect x="10" y="10" width="240" height="400" rx="32" stroke="#3D1F0A" strokeWidth="2" />
      {/* Screen */}
      <rect x="24" y="50" width="212" height="330" rx="16" fill="#F5EDE0" />
      {/* Speaker */}
      <rect x="100" y="24" width="60" height="10" rx="5" fill="#0D0603" />
      {/* Home indicator */}
      <rect x="95" y="398" width="70" height="5" rx="2.5" fill="#3D1F0A" />

      {/* WA header bar */}
      <rect x="24" y="50" width="212" height="44" rx="0" fill="#2A7A4F" />
      <rect x="24" y="50" width="212" height="8" rx="0" fill="#2A7A4F" />
      {/* Store avatar circle */}
      <circle cx="52" cy="72" r="14" fill="#FDF4E8" />
      {/* Store icon in avatar */}
      <rect x="44" y="66" width="16" height="14" rx="2" fill="#C24B2A" />
      <rect x="42" y="64" width="20" height="4" rx="1" fill="#3D1F0A" />
      <rect x="46" y="70" width="4" height="4" rx="1" fill="#FDF4E8" />
      <rect x="54" y="70" width="4" height="4" rx="1" fill="#FDF4E8" />
      {/* Store name text */}
      <rect x="73" y="66" width="72" height="7" rx="3.5" fill="#ffffff" opacity="0.9" />
      <rect x="73" y="77" width="48" height="5" rx="2.5" fill="#ffffff" opacity="0.5" />

      {/* ── Chat messages ── */}

      {/* Incoming msg 1 */}
      <rect x="32" y="106" width="132" height="44" rx="12" fill="#ffffff" />
      <polygon points="32,130 18,140 36,130" fill="#ffffff" />
      <rect x="42" y="116" width="100" height="8" rx="4" fill="#3D1F0A" opacity="0.7" />
      <rect x="42" y="130" width="70" height="6" rx="3" fill="#3D1F0A" opacity="0.35" />
      <rect x="116" y="140" width="30" height="5" rx="2.5" fill="#3D1F0A" opacity="0.2" />

      {/* Outgoing msg 1 */}
      <rect x="96" y="164" width="140" height="44" rx="12" fill="#C24B2A" />
      <polygon points="236,188 250,198 232,188" fill="#C24B2A" />
      <rect x="106" y="174" width="108" height="8" rx="4" fill="#ffffff" opacity="0.9" />
      <rect x="106" y="188" width="72" height="6" rx="3" fill="#ffffff" opacity="0.55" />
      {/* double tick */}
      <path d="M202,200 L210,208 L224,192" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <path d="M195,200 L202,208" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.55" />

      {/* Incoming msg 2 */}
      <rect x="32" y="222" width="148" height="44" rx="12" fill="#ffffff" />
      <polygon points="32,246 18,256 36,246" fill="#ffffff" />
      <rect x="42" y="232" width="116" height="8" rx="4" fill="#3D1F0A" opacity="0.7" />
      <rect x="42" y="246" width="80" height="6" rx="3" fill="#3D1F0A" opacity="0.35" />
      <rect x="128" y="257" width="30" height="5" rx="2.5" fill="#3D1F0A" opacity="0.2" />

      {/* Outgoing msg 2 */}
      <rect x="80" y="280" width="156" height="62" rx="12" fill="#C24B2A" />
      <polygon points="236,310 250,320 232,310" fill="#C24B2A" />
      <rect x="90" y="292" width="124" height="8" rx="4" fill="#ffffff" opacity="0.9" />
      <rect x="90" y="306" width="96" height="6" rx="3" fill="#ffffff" opacity="0.6" />
      <rect x="90" y="318" width="60" height="6" rx="3" fill="#ffffff" opacity="0.4" />
      {/* double tick */}
      <path d="M206,333 L214,341 L228,325" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <path d="M199,333 L206,341" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.55" />

      {/* Type bar */}
      <rect x="24" y="356" width="212" height="24" rx="0" fill="#ECDFD4" />
      <rect x="32" y="361" width="140" height="12" rx="6" fill="#D4C4B0" />
      <circle cx="220" cy="368" r="10" fill="#2A7A4F" />
      {/* mic icon */}
      <rect x="216" y="362" width="8" height="10" rx="4" fill="#ffffff" />
      <path d="M213,369 Q213,376 220,376 Q227,376 227,369" stroke="#ffffff" strokeWidth="1.5" fill="none" />
      <line x1="220" y1="376" x2="220" y2="380" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  )
}

// ── Left panel ────────────────────────────────────────────────────────────────
function BrandPanel({ subtitle }) {
  return (
    <div style={{
      flex: 1, background: '#3D1F0A',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 40px', position: 'relative', overflow: 'hidden',
      minHeight: 480,
    }}>
      {/* subtle top-right glow */}
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,134,14,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* bottom-left glow */}
      <div style={{
        position: 'absolute', bottom: -60, left: -60,
        width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,75,42,0.22) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo lockup */}
      <div style={{ marginBottom: 36, textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#C24B2A', textTransform: 'uppercase', marginBottom: 10 }}>
          Run your shop.
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1, color: '#FDF4E8' }}>
          Business<span style={{ color: '#D4860E' }}>Vaani</span>
        </div>
      </div>

      {/* Phone */}
      <div style={{ zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <PhoneIllustration />
      </div>

      {/* Caption */}
      <p style={{ marginTop: 32, fontSize: 13, color: '#9A7860', textAlign: 'center', maxWidth: 240, lineHeight: 1.6, zIndex: 1 }}>
        {subtitle}
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false) }
    else router.push('/dashboard')
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    background: '#FDFCFB', border: '1.5px solid #EADDCF',
    borderRadius: 12, color: '#2D241E', fontSize: 15,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      background: '#FDF4E8',
    }}>
      {/* ── Left visual panel ── */}
      <div style={{ flex: '0 0 440px', display: 'none' }} className="brand-panel-desktop">
        <BrandPanel subtitle="Orders coming in on WhatsApp — handled automatically. In Hindi, Tamil, and more." />
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', position: 'relative', overflow: 'hidden',
        minHeight: '100vh',
      }}>
        {/* Subtle bg tint */}
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
            Welcome back
          </h2>
          <p style={{ fontSize: 14, color: '#9A7860', marginBottom: 28 }}>
            Sign in to manage your Vaani store
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

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#C24B2A', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
              <input
                type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#C24B2A'}
                onBlur={e => e.target.style.borderColor = '#EADDCF'}
                required
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#C24B2A', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
              <input
                type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#C24B2A'}
                onBlur={e => e.target.style.borderColor = '#EADDCF'}
                required
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <span style={{ fontSize: 12, color: '#C24B2A', fontWeight: 600, cursor: 'pointer' }}>Forgot password?</span>
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
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#EADDCF' }} />
            <span style={{ fontSize: 12, color: '#C4B4A4', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#EADDCF' }} />
          </div>


          <p style={{ marginTop: 24, fontSize: 13, color: '#9A7860', textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: '#C24B2A', fontWeight: 700, textDecoration: 'none' }}>
              Join Vaani
            </Link>
          </p>
        </div>
      </div>

      {/* Desktop: show brand panel on left */}
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