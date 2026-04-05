'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/lib/theme'
import Chatbot from './chatbot'
import Tour from './Tour'
import InstallPrompt from './InstallPrompt'
import OfflineStatus from './OfflineStatus'
import InstallPrompt from './InstallPrompt'
import OfflineStatus from './OfflineStatus'

import { supabase } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard', icon: '▦', label: 'Dashboard', color: '#38bdf8' },
  { href: '/dashboard/orders', icon: '◦', label: 'Orders', color: '#818cf8' },
  { href: '/dashboard/khata', icon: '▤', label: 'Khata', color: '#ffb233' },
  { href: '/dashboard/inventory', icon: '⬡', label: 'Inventory', color: '#a3e635' },
  { href: '/dashboard/invoices', icon: '⬕', label: 'Invoices', color: '#f59e0b' },
  { href: '/dashboard/payments', icon: '💳', label: 'Payments', color: '#eab308' },
  { href: '/dashboard/buyers', icon: '◉', label: 'Buyers', color: '#a78bfa' },
  { href: '/dashboard/delivery', icon: '🚚', label: 'Delivery', color: '#ff4757' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Settings', color: '#cbd5e1' },
]


export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

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
    async function fetchProfile(userId) {
      const { data } = await supabase.from('business_profiles').select('*').eq('id', userId).single()
      if (data) setProfile(data)
      setAuthLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error && (error.message?.includes('Refresh Token Not Found') || error.status === 401)) {
        console.warn('Session expired or corrupted, clearing state...')
        supabase.auth.signOut().then(() => {
          setAuthLoading(false)
        })
        return
      }
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      else setAuthLoading(false)
    }).catch(err => {
      console.error('Session recovery error:', err)
      setAuthLoading(false)
    })


    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
    })

    const handleProfileUpdate = () => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) fetchProfile(user.id)
      })
    }
    window.addEventListener('profileUpdated', handleProfileUpdate)

    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
          console.log('SW registered:', reg);
        }).catch((err) => {
          console.log('SW registration failed:', err);
        });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [])

  const sidebarWidth = isMobile ? 260 : (collapsed ? 64 : 236)

  if (authLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)' }}>Loading...</div>

  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

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
          background: theme === 'dark' ? 'var(--surface)' : 'var(--card)',
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
          background: 'radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: (collapsed && !isMobile) ? '0 12px' : '0 20px',
          height: 62, borderBottom: '1px solid var(--border)',
          flexShrink: 0, position: 'relative',
        }}>
          <img src={profile?.logo_url || "/logo.png"} alt="Logo" style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            objectFit: 'contain', background: '#fff',
            padding: 2, border: '1px solid var(--border-mid)'
          }} />
          {(!collapsed || isMobile) && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                {profile?.business_name || 'BusinessVaani'}
              </p>
              <p style={{ fontSize: 9, color: 'var(--muted)', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Management Hub</p>
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
              <Link id={`tour-nav-${label.toLowerCase()}`} key={href} href={href} style={{
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
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.15)',
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

        {/* Sidebar Footer — Collapse (desktop) & Logout (all) */}
        <div style={{ display: 'flex', flexDirection: (collapsed && !isMobile) ? 'column' : 'row', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {!isMobile && (
            <button
              onClick={() => setCollapsed(c => !c)}
              style={{
                flex: collapsed ? 'none' : 1,
                display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 8, padding: collapsed ? '14px 20px' : '14px 18px',
                border: 'none', cursor: 'pointer',
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
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/'
            }}
            style={{
              flex: (collapsed && !isMobile) ? 'none' : 1,
              display: 'flex', padding: (collapsed && !isMobile) ? '14px 20px' : '14px 18px',
              alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer',
              borderLeft: (collapsed || isMobile) ? 'none' : '1px solid var(--border)',
              borderTop: (collapsed && !isMobile) ? '1px solid var(--border)' : 'none',
              background: 'transparent', color: '#ef4444',
              fontSize: 12, fontWeight: 600, transition: 'background 0.15s',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              width: isMobile ? '100%' : 'auto',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            title="Logout"
          >
            {(collapsed && !isMobile) ? '⎋' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="dashboard-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <header className="dashboard-topbar" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', height: 62, flexShrink: 0,
          background: theme === 'dark' ? 'rgba(15,22,35,0.88)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(14px)',
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
                {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 8,
                border: '1px solid var(--border-mid)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--muted-light)', cursor: 'pointer',
                fontSize: 16, transition: 'all 0.15s',
              }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, display: isMobile ? 'none' : 'block' }}>{user?.email}</span>
              {profile?.logo_url ? (
                <img src={profile.logo_url} alt="Logo" style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  objectFit: 'contain', background: '#fff'
                }} />
              ) : (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00e5c3 0%, #818cf8 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: '#021a15',
                }}>{profile?.business_name ? profile.business_name[0].toUpperCase() : 'V'}</div>
              )}
            </div>
          </div>
        </header>

        <main className="dashboard-content" style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '16px' : '28px 32px',
          paddingBottom: isMobile ? 160 : 32
        }}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 64, background: theme === 'dark' ? 'rgba(15,22,35,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          zIndex: 90, paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
        }}>
          {[
            { href: '/dashboard', icon: '▦', label: 'Home', color: '#38bdf8' },
            { href: '/dashboard/orders', icon: '◦', label: 'Orders', color: '#818cf8' },
            { href: '/dashboard/khata', icon: '▤', label: 'Khata', color: '#ffb233' },
            { href: '/dashboard/inventory', icon: '⬡', label: 'Stock', color: '#a3e635' },
          ].map(n => {
            const active = pathname === n.href
            return (
              <Link key={n.href} href={n.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                textDecoration: 'none', color: active ? n.color : 'var(--muted)',
                transition: 'all 0.2s', padding: '8px 12px'
              }}>
                <span style={{ fontSize: 18, opacity: active ? 1 : 0.6, transform: active ? 'scale(1.15)' : 'scale(1.1)' }}>{n.icon}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 800 : 500, opacity: active ? 1 : 0.8 }}>{n.label}</span>
                {active && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: n.color, marginTop: -2 }} />
                )}
              </Link>
            )
          })}
        </nav>
      )}

      {/* PWA Install Prompt */}
      <InstallPrompt />
      {/* Chatbot Widget */}
      <Chatbot />

      {/* Onboarding Tour */}
      <Tour />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Offline Status indicator */}
      <OfflineStatus />
    </div>
  )
}
