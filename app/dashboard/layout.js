'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

import { supabase } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard',           icon: '▦',  label: 'Dashboard',  color: '#38bdf8' },
  { href: '/dashboard/inventory', icon: '⬡',  label: 'Inventory',  color: '#a3e635' },
  { href: '/dashboard/orders',    icon: '◦',  label: 'Orders',     color: '#818cf8' },
  { href: '/dashboard/invoices',  icon: '⬕',  label: 'Invoices',   color: '#f59e0b' },
  { href: '/dashboard/payments',  icon: '◈',  label: 'Payments',   color: '#00e5c3' },
  { href: '/dashboard/khata',     icon: '📒', label: 'Khata',      color: '#fb7185' },
  { href: '/dashboard/buyers',    icon: '◉',  label: 'Buyers',     color: '#a78bfa' },
  { href: '/dashboard/settings',  icon: '⚙️',  label: 'Settings',   color: '#cbd5e1' },
]

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <form onSubmit={handleLogin} style={{ background: 'var(--surface)', padding: 40, borderRadius: 16, width: 360, outline: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: '#fff' }}>Sign In</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>to access Vaani Settings & Dashboard</p>
        
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', marginBottom: 12 }} required />
        
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', marginBottom: 24 }} required />
        
        <button type="submit" disabled={loading}
          style={{ width: '100%', background: 'linear-gradient(135deg, #00e5c3, #818cf8)', color: '#000', fontWeight: 800, padding: 14, borderRadius: 8, border: 'none', cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const pathname = usePathname()

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close sidebar on nav on mobile
  useEffect(() => {
    if (isMobile) setMobileOpen(false)
  }, [pathname, isMobile])

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const sidebarWidth = isMobile ? 260 : (collapsed ? 64 : 236)

  if (authLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)' }}>Loading...</div>
  if (!user) return <LoginScreen />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar ${isMobile && mobileOpen ? 'open' : ''}`}
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          position: isMobile ? 'fixed' : 'relative',
          zIndex: isMobile ? 100 : 'auto',
          top: 0, bottom: 0, left: 0,
          transform: (isMobile && !mobileOpen) ? 'translateX(-100%)' : 'translateX(0)',
        }}>
        {/* Sidebar top glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 200,
          background: 'radial-gradient(ellipse at 50% -20%, rgba(0,229,195,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: (collapsed && !isMobile) ? '0 16px' : '0 20px',
          height: 62, borderBottom: '1px solid var(--border)',
          flexShrink: 0, position: 'relative',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #00e5c3 0%, #818cf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 900, color: '#021a15',
            boxShadow: '0 4px 16px rgba(0,229,195,0.35)',
          }}>V</div>
          {(!collapsed || isMobile) && (
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Vaani</p>
              <p style={{ fontSize: 9.5, color: 'var(--muted)', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Business Hub</p>
            </div>
          )}
          {/* Mobile close button */}
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} style={{
              marginLeft: 'auto', width: 32, height: 32, borderRadius: 8,
              border: '1px solid var(--border-mid)', background: 'rgba(255,255,255,0.04)',
              color: 'var(--muted-light)', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' }}>
          {(!collapsed || isMobile) && (
            <p style={{
              fontSize: 9.5, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em',
              textTransform: 'uppercase', padding: '4px 12px 6px', margin: 0,
            }}>Menu</p>
          )}
          {NAV.map(({ href, icon, label, color }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center',
                gap: 10, padding: (collapsed && !isMobile) ? '10px 15px' : '9px 12px',
                borderRadius: 11, textDecoration: 'none',
                fontSize: 13.5, fontWeight: active ? 700 : 500,
                color: active ? color : 'var(--muted-light)',
                background: active ? `${color}12` : 'transparent',
                border: active ? `1px solid ${color}25` : '1px solid transparent',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap', overflow: 'hidden',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-light)' } }}
              >
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 3, borderRadius: '0 3px 3px 0',
                    background: color,
                  }} />
                )}
                <span style={{
                  fontSize: 14, flexShrink: 0,
                  opacity: active ? 1 : 0.65,
                  color: active ? color : 'inherit',
                }}>{icon}</span>
                {(!collapsed || isMobile) && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom status */}
        {(!collapsed || isMobile) && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{
              background: 'rgba(0,229,195,0.06)',
              border: '1px solid rgba(0,229,195,0.15)',
              borderRadius: 10, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span className="live-dot" style={{ width: 6, height: 6, background: 'var(--teal)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--teal)', margin: 0 }}>WhatsApp Live</p>
                <p style={{ fontSize: 10, color: 'var(--muted)', margin: 0 }}>Receiving orders</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse — desktop only */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8, padding: collapsed ? '14px 20px' : '14px 18px',
              border: 'none', cursor: 'pointer',
              borderTop: '1px solid var(--border)',
              background: 'transparent', color: 'var(--muted)',
              fontSize: 12, transition: 'color 0.15s, background 0.15s',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{
              fontSize: 13,
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.25s',
              display: 'inline-block',
            }}>‹</span>
            {!collapsed && <span style={{ fontWeight: 500 }}>Collapse</span>}
          </button>
        )}
      </aside>

      {/* Main */}
      <div className="dashboard-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <header className="dashboard-topbar" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', height: 62, flexShrink: 0,
          background: 'rgba(15,22,35,0.88)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Hamburger — mobile only */}
            <button className="hamburger-btn" onClick={() => setMobileOpen(true)}
              style={{
                display: isMobile ? 'flex' : 'none',
                alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 10,
                border: '1px solid var(--border-mid)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--muted-light)', cursor: 'pointer',
                fontSize: 18, transition: 'all 0.15s',
                marginRight: 8,
              }}
            >☰</button>
            <span className="live-dot" style={{ width: 7, height: 7, background: 'var(--teal)' }} />
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Live</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              padding: '5px 12px', borderRadius: 8,
            }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>📅</span>
              <span style={{ fontSize: 12, color: 'var(--muted-light)', fontWeight: 500 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e5c3 0%, #818cf8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#021a15',
            }}>V</div>
          </div>
        </header>

        <main className="dashboard-content" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
