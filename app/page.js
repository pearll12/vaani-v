'use client'

import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Scroll-triggered text reveal ───────────────────────────────────────────
function RevealText({ children, delay = 0, className = '', style = {} }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// ─── WhatsApp message bubble ─────────────────────────────────────────────────
function WaBubble({ text, time, isOut = false, delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isOut ? 30 : -30, scale: 0.9 }}
      animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        justifyContent: isOut ? 'flex-end' : 'flex-start',
        marginBottom: 8,
      }}
    >
      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: isOut ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
        background: isOut ? '#005c4b' : 'rgba(255,255,255,0.06)',
        fontSize: 13,
        lineHeight: 1.5,
        color: '#e5e7eb',
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        position: 'relative',
      }}>
        {text}
        <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'right', marginTop: 4 }}>{time}</span>
      </div>
    </motion.div>
  )
}

// ─── Chapter label ───────────────────────────────────────────────────────────
function ChapterLabel({ num, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'rgba(245, 158, 11, 0.15)',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: 1,
        fontFamily: 'var(--font-mono, monospace)',
        flexShrink: 0,
      }}>
        {num}
      </div>
      <span style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 600 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(245,158,11,0.15)' }} />
    </div>
  )
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  useEffect(() => {
    if (!isInView) return
    let start = 0
    const step = target / 60
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, target])
  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>
}

// ─── Feature story card ──────────────────────────────────────────────────────
function FeatureCard({ icon, act, title, desc, visual, delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3rem',
        alignItems: 'center',
        padding: '4rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700, marginBottom: 16 }}>
          {act}
        </div>
        <div style={{ fontSize: 40, marginBottom: 20 }}>{icon}</div>
        <h3 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
          fontWeight: 700,
          color: 'white',
          lineHeight: 1.2,
          marginBottom: 16,
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h3>
        <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.8 }}>{desc}</p>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '2rem',
        minHeight: 220,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {visual}
      </div>
    </motion.div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <div style={{ minHeight: '100vh', background: '#050b18', color: '#e2e8f0', overflowX: 'hidden' }}>

      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        ::selection { background: rgba(245,158,11,0.25); color: white; }

        @media (max-width: 768px) {
          .feature-grid { grid-template-columns: 1fr !important; }
          .feature-grid > div:first-child { order: 2; }
          .feature-grid > div:last-child { order: 1; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-title { font-size: clamp(2.8rem, 10vw, 4rem) !important; }
        }
      `}</style>

      {/* ─────────────── NAVBAR ─────────────── */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 100,
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(5, 11, 24, 0.85)',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8 }} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
              Business<span style={{ color: '#f59e0b' }}>Vaani</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', textDecoration: 'none' }}>
              Login
            </Link>
            <Link href="/signup" style={{
              fontSize: '0.85rem', fontWeight: 600,
              padding: '0.45rem 1.25rem', borderRadius: 99,
              background: '#f59e0b', color: '#050b18',
              textDecoration: 'none', letterSpacing: '0.01em',
            }}>
              Shuru Karo →
            </Link>
          </div>
        </div>
      </nav>

      {/* ─────────────── HERO ─────────────── */}
      <section ref={heroRef} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', paddingTop: 80 }}>

        {/* Ambient background glow */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, textAlign: 'center', padding: '0 2rem', maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}
        >
          {/* Pre-title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}
          >
            <div style={{ height: 1, width: 40, background: 'rgba(245,158,11,0.5)' }} />
            <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 600 }}>
              Ek Dukaan Ki Kahani
            </span>
            <div style={{ height: 1, width: 40, background: 'rgba(245,158,11,0.5)' }} />
          </motion.div>

          {/* Main heading */}
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(3.5rem, 8vw, 5.5rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: 'white',
              marginBottom: 28,
            }}
          >
            Aapki awaaz,{' '}
            <em style={{ fontStyle: 'italic', color: '#f59e0b' }}>
              aapka hisaab.
            </em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: 580, margin: '0 auto 48px auto', lineHeight: 1.75, fontWeight: 300 }}
          >
            WhatsApp ke voice orders sunta hai, samajhta hai, aur pal bhar mein invoice, inventory aur payment link tyaar kar deta hai.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}
          >
            <Link href="/signup" style={{
              background: '#f59e0b', color: '#050b18', fontWeight: 700,
              padding: '0.9rem 2.5rem', borderRadius: 99,
              fontSize: '1rem', letterSpacing: '-0.01em',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Muft Shuru Karo
              <span style={{ fontSize: 18 }}>→</span>
            </Link>
            <a
              href="https://wa.me/14155238886?text=join separate-while"
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0', fontWeight: 500,
                padding: '0.9rem 2rem', borderRadius: 99,
                fontSize: '0.95rem', letterSpacing: '-0.01em',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ color: '#25D366', fontSize: 18 }}>●</span> Demo Try Karo
            </a>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            style={{ marginTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#475569' }}
          >
            <span style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Kahani padho</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(245,158,11,0.6), transparent)' }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ─────────────── ACT 1: THE PROBLEM ─────────────── */}
      <section style={{ padding: '120px 2rem', maxWidth: 1140, margin: '0 auto' }}>
        <RevealText>
          <ChapterLabel num="I" label="Pehle ka dard" />
        </RevealText>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }} className="feature-grid">
          <RevealText delay={0.1}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: 24,
            }}>
              Roz ka yahi scene tha — chaotic WhatsApp, bichde orders, khoya hua paisa.
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 32 }}>
              Subah se raat tak voice notes sun-sun ke order likhna, manually invoice banana, GST calculate karna... aur phir bhi kuch na kuch chhoot hi jaata tha.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['📋', '47 unread WhatsApp orders'],
                ['🧾', 'Paper slips — adha khoya, adha purana'],
                ['📦', 'Stock counted by memory'],
                ['💸', 'Udhaar yaad nahi kiska kitna'],
              ].map(([icon, text]) => (
                <div key={text} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  borderRadius: 12,
                  border: '1px solid rgba(239,68,68,0.12)',
                  fontSize: '0.9rem', color: '#fca5a5',
                }}>
                  <span>{icon}</span> {text}
                </div>
              ))}
            </div>
          </RevealText>

          {/* WhatsApp mockup */}
          <RevealText delay={0.3}>
            <div style={{
              background: '#0e1621',
              borderRadius: 20,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
            }}>
              {/* WA header */}
              <div style={{
                background: '#1f2c34',
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👨‍🌾</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#e5e7eb' }}>Ramesh Kirana Store</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>last seen today at 2:41 PM</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: '16px', background: '#0b141a', minHeight: 320 }}>
                <WaBubble text="bhai 5 kg aata, 2 kg dal, 1 bottle oil — aaj hi chahiye" time="10:12 AM" delay={0.4} />
                <WaBubble text="kitna hua total?" time="10:13 AM" delay={0.55} />
                <WaBubble text="vo wali baraik cheeni bhi dena" time="10:14 AM" delay={0.7} />
                <WaBubble text="aur haan 500 ka credit tha mera, woh deduct karna" time="10:15 AM" delay={0.85} />
                <WaBubble text="bhaiya aap sun rahe ho?" time="10:22 AM" delay={1.0} />
                <div style={{ textAlign: 'center', margin: '12px 0' }}>
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: 99, color: '#6b7280' }}>
                    3 aur messages aaye voice mein 🎤
                  </span>
                </div>
                <WaBubble text="Haan bhai aa gaya, abhi likhta hoon..." time="10:31 AM" isOut delay={1.15} />
              </div>
            </div>
          </RevealText>
        </div>
      </section>

      {/* ─────────────── THE TURN ─────────────── */}
      <section style={{ padding: '80px 2rem', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <RevealText style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 600, marginBottom: 24 }}>
            — Tab aaya badlaav —
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.2rem, 5vw, 4rem)',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: 20,
          }}>
            <em style={{ fontStyle: 'italic', color: '#f59e0b' }}>BusinessVaani</em>{' '}
            ne pehla order suna, samjha, aur khud likh diya.
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.75 }}>
            Voice message aaya → AI ne items pakde → Invoice bana → Inventory ghati → Payment link gaya. Sab kuch 4 second mein.
          </p>
        </RevealText>
      </section>

      {/* ─────────────── ACT 2: FEATURES AS STORY BEATS ─────────────── */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '40px 2rem 120px' }}>
        <RevealText>
          <ChapterLabel num="II" label="Kahani ka naya adhyay" />
        </RevealText>

        {/* Feature 1: Voice */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', padding: '4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="feature-grid">
          <RevealText delay={0.1}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700, marginBottom: 16 }}>Pehla qadam</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.02em' }}>
              Boliye, bas boliye — likhna band karo.
            </h3>
            <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.8 }}>
              "Bhai teen kilo chawal, paanch packet namkeen, do litre tel" — itna bol do. AI Hinglish, Hindi, aur regional accents samjhta hai. Koi typing nahi, koi copy-paste nahi.
            </p>
          </RevealText>
          <RevealText delay={0.3}>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], background: ['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.25)', 'rgba(245,158,11,0.1)'] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                  style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}
                >
                  🎙️
                </motion.div>
                <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    style={{ height: '100%', background: 'linear-gradient(to right, #f59e0b, #fbbf24)', borderRadius: 99 }}
                  />
                </div>
              </div>
              {['3 kg chawal', '5 packet namkeen', '2 L sunflower tel'].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.3 + 0.5, repeat: Infinity, repeatDelay: 3 }}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(245,158,11,0.05)', borderRadius: 8, marginBottom: 8, fontSize: 13, color: '#fde68a', border: '1px solid rgba(245,158,11,0.1)' }}
                >
                  <span>{item}</span>
                  <span style={{ color: '#f59e0b' }}>✓ extracted</span>
                </motion.div>
              ))}
            </div>
          </RevealText>
        </div>

        {/* Feature 2: Invoice */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', padding: '4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="feature-grid">
          <RevealText delay={0.3} style={{ order: 2 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem', fontFamily: 'monospace' }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, letterSpacing: 2 }}>INVOICE #2847</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>BusinessVaani Auto-Generated • 2 sec</div>
              </div>
              {[['3 kg Chawal', '₹180'], ['5 Namkeen Pkt', '₹125'], ['2L Sunflower Tel', '₹340']].map(([name, price]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span>{name}</span><span style={{ color: '#e2e8f0' }}>{price}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                  <span>CGST 9%</span><span>₹58.05</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                  <span>SGST 9%</span><span>₹58.05</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: 'white', fontWeight: 700 }}>
                  <span>Total</span><span style={{ color: '#f59e0b' }}>₹761.10</span>
                </div>
              </div>
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ marginTop: 16, padding: '8px 12px', background: 'rgba(37,211,102,0.1)', borderRadius: 8, fontSize: 11, color: '#4ade80', textAlign: 'center', border: '1px solid rgba(37,211,102,0.2)' }}
              >
                📲 WhatsApp pe payment link bheja gaya
              </motion.div>
            </div>
          </RevealText>
          <RevealText delay={0.1} style={{ order: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700, marginBottom: 16 }}>Doosra qadam</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.02em' }}>
              GST ka jhanjhat? Ab AI ka kaam.
            </h3>
            <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.8 }}>
              CGST, SGST, item-wise breakup — sab automatic. Professional invoice 2 second mein ready, seedha WhatsApp pe. Accountant ki zaroorat nahi.
            </p>
          </RevealText>
        </div>

        {/* Feature 3: Khata */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', padding: '4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="feature-grid">
          <RevealText delay={0.1}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700, marginBottom: 16 }}>Teesra qadam</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.02em' }}>
              Digital Khata — Ramesh ka udhaar kabhi nahi bhoolta.
            </h3>
            <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.8 }}>
              Kaun, kitna, kab — sab ek jagah. Voice se bol do "Ramesh ne 200 diye" — khud update ho jaata hai. Reminder bhi automatic.
            </p>
          </RevealText>
          <RevealText delay={0.3}>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem' }}>
              {[
                { name: 'Ramesh Sharma', amount: '₹1,240', due: '12 days', color: '#ef4444' },
                { name: 'Suresh Gupta', amount: '₹680', due: '3 days', color: '#f59e0b' },
                { name: 'Meena Devi', amount: '₹90', due: 'Today', color: '#22c55e' },
              ].map(({ name, amount, due, color }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#94a3b8', fontWeight: 600, border: '1px solid rgba(255,255,255,0.07)' }}>
                      {name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{name}</div>
                      <div style={{ fontSize: 11, color: color }}>Due: {due}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: '#f59e0b', fontWeight: 600, fontFamily: 'monospace' }}>{amount}</div>
                </div>
              ))}
              <div style={{ paddingTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Total baki</span>
                <span style={{ color: '#fde68a', fontWeight: 700, fontFamily: 'monospace' }}>₹2,010</span>
              </div>
            </div>
          </RevealText>
        </div>
      </section>

      {/* ─────────────── STATS ─────────────── */}
      <section style={{ padding: '80px 2rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3rem', textAlign: 'center' }} className="stats-grid">
          {[
            { n: 1000, suffix: '+', label: 'Active Dukaandar' },
            { n: 47000, suffix: '+', label: 'Orders Processed' },
            { n: 99, suffix: '%', label: 'Voice Accuracy' },
          ].map(({ n, suffix, label }) => (
            <RevealText key={label}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: 'white', letterSpacing: '-0.04em' }}>
                <Counter target={n} suffix={suffix} />
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 8, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</div>
            </RevealText>
          ))}
        </div>
      </section>

      {/* ─────────────── CTA ─────────────── */}
      <section style={{ padding: '140px 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center bottom, rgba(245,158,11,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <RevealText style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <ChapterLabel num="III" label="Aapki baari" />
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 24,
          }}>
            Aapki dukaan ki kahani ab nayi likhiye.
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.75, marginBottom: 48 }}>
            1,000 se zyada dukaandar pehle se apna waqt bacha rahe hain. Aap kab shuru karte ho?
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              background: '#f59e0b', color: '#050b18', fontWeight: 700,
              padding: '1rem 3rem', borderRadius: 99, fontSize: '1.05rem',
              textDecoration: 'none', letterSpacing: '-0.01em',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Muft mein try karo →
            </Link>
          </div>
          <div style={{ marginTop: 24, fontSize: 12, color: '#334155' }}>
            Koi credit card nahi chahiye • 5 minute mein setup
          </div>
        </RevealText>
      </section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer style={{ padding: '48px 2rem', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: 'white', fontSize: '1rem' }}>
            Business<span style={{ color: '#f59e0b' }}>Vaani</span>
          </span>
          <div style={{ display: 'flex', gap: 32, fontSize: '0.875rem', color: '#475569' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Documentation</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Support</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
          </div>
          <div style={{ fontSize: 12, color: '#1e293b' }}>
            © {new Date().getFullYear()} BusinessVaani
          </div>
        </div>
      </footer>

      {/* ─────────────── FLOATING WA BUTTON ─────────────── */}
      <motion.a
        href="https://wa.me/14155238886?text=join separate-while"
        target="_blank"
        rel="noreferrer"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2 }}
        whileHover={{ scale: 1.1 }}
        style={{
          position: 'fixed', bottom: 28, right: 28,
          background: '#25D366', width: 56, height: 56,
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white', fontSize: 24,
          textDecoration: 'none', zIndex: 1000,
          boxShadow: '0 8px 24px rgba(37,211,102,0.35)',
        }}
        title="Try AI Order Bot on WhatsApp"
      >
        💬
      </motion.a>
    </div>
  )
}