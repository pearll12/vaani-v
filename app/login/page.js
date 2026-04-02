'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Mic } from 'lucide-react'

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
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', height: '100vh', 
      alignItems: 'center', justifyContent: 'center', 
      background: '#04080f', color: '#fff', 
      fontFamily: '"Plus Jakarta Sans", sans-serif', padding: 20
    }}>
      <Link href="/" style={{ position: 'absolute', top: 32, left: 32, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <form onSubmit={handleLogin} style={{ 
        background: 'rgba(15, 22, 35, 0.8)', padding: '48px 40px', 
        borderRadius: 24, width: '100%', maxWidth: 420, 
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg, #00e5c3, #818cf8)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#000',
            boxShadow: '0 0 20px rgba(0, 229, 195, 0.4)'
          }}>
            <Mic size={24} strokeWidth={2.5} />
          </div>
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', textAlign: 'center', letterSpacing: '-0.02em' }}>Welcome back</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32, textAlign: 'center' }}>Sign in to continue to Vaani Dashboard</p>
        
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)', padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 20, fontWeight: 500 }}>{error}</div>}
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
            style={{ 
              width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.2)', 
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 15,
              outline: 'none', transition: 'border 0.2s'
            }} 
            onFocus={e => e.target.style.border = '1px solid #00e5c3'}
            onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
            required 
          />
        </div>
        
        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
            style={{ 
              width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.2)', 
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 15,
              outline: 'none', transition: 'border 0.2s'
            }} 
            onFocus={e => e.target.style.border = '1px solid #00e5c3'}
            onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
            required 
          />
        </div>
        
        <button type="submit" disabled={loading}
          style={{ 
            width: '100%', background: 'linear-gradient(135deg, #00e5c3, #818cf8)', 
            color: '#000', fontSize: 16, fontWeight: 800, padding: 16, borderRadius: 12, 
            border: 'none', cursor: loading ? 'wait' : 'pointer',
            boxShadow: '0 10px 20px rgba(0, 229, 195, 0.2)',
            transition: 'transform 0.2s, opacity 0.2s',
            opacity: loading ? 0.7 : 1
          }}
          onMouseEnter={e => { if(!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { if(!loading) e.currentTarget.style.transform = 'translateY(0)' }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          Don't have an account? <Link href="/signup" style={{ color: '#00e5c3', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </p>
      </form>
    </div>
  )
}
