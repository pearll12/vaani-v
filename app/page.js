'use client'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Mic, ArrowUpRight, Package, FileText, CheckCircle2, MessageSquare, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react'

export default function Home() {
  const { scrollYProgress } = useScroll()
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#04080f', // Deep dark space background
      color: '#eef2f9',
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      overflowX: 'hidden'
    }}>

      {/* --- ELEGANT DARK NAVBAR --- */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%',
        padding: '20px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 50,
        background: 'rgba(4, 8, 15, 0.6)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #00e5c3, #818cf8)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#000',
            boxShadow: '0 0 20px rgba(0, 229, 195, 0.4)'
          }}>
            <Mic size={20} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>BusinessVaani</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >
            Sign In
          </Link>
          <Link href="/signup" style={{
            background: 'rgba(255,255,255,0.1)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '10px 24px', borderRadius: 999,
            fontSize: 14, fontWeight: 700,
            textDecoration: 'none', transition: 'all 0.3s',
            display: 'flex', alignItems: 'center', gap: 8
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        position: 'relative',
        padding: '140px 24px 80px',
      }}>
        {/* Dynamic Dark Glowing Backgrounds */}
        <motion.div style={{ y: y1, position: 'absolute', top: '10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(129, 140, 248, 0.15) 0%, transparent 60%)', filter: 'blur(100px)', zIndex: 0 }} />
        <motion.div style={{ y: y2, position: 'absolute', bottom: '10%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(0, 229, 195, 0.12) 0%, transparent 60%)', filter: 'blur(100px)', zIndex: 0 }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', zIndex: 1, maxWidth: 1000 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 20px', borderRadius: 999, background: 'rgba(0, 229, 195, 0.1)',
              border: '1px solid rgba(0, 229, 195, 0.3)',
              color: '#00e5c3', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 32
            }}
          >
            <Sparkles size={16} /> Intelligent Voice Commerce
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            style={{
              fontSize: 'clamp(56px, 8vw, 110px)', fontWeight: 800,
              lineHeight: 1, letterSpacing: '-0.04em', margin: '0 0 32px',
              color: '#fff'
            }}
          >
            Voice to Order.<br />
            <span style={{ 
              color: 'transparent', 
              background: 'linear-gradient(to right, #00e5c3, #818cf8, #a855f7)', 
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              paddingRight: '0.1em'
            }}>
              Instantly.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            style={{
              fontSize: 'clamp(18px, 2vw, 24px)', color: 'rgba(255,255,255,0.6)', 
              maxWidth: 700, margin: '0 auto 48px',
              lineHeight: 1.6, fontWeight: 500
            }}
          >
            Turn chaotic WhatsApp messages into structured orders, auto-generated PDF invoices, and real-time inventory—just by speaking.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Link href="/signup" style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: 'linear-gradient(135deg, #00e5c3, #818cf8)', color: '#000',
              padding: '18px 40px', borderRadius: 999,
              fontSize: 16, fontWeight: 800,
              textDecoration: 'none', transition: 'transform 0.3s',
              boxShadow: '0 20px 40px rgba(0, 229, 195, 0.3)'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Start Your Free Store <ArrowUpRight size={20} />
            </Link>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              color: '#fff', fontSize: 16, fontWeight: 600,
              textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)',
              paddingBottom: 4
            }}>
              See a Demo
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* --- CINEMATIC NARRATIVE: THE PROBLEM VS REALITY --- */}
      <section style={{ padding: '160px 24px', background: '#070b13', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 120 }}>
            <h2 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: '0 0 24px' }}>Two Worlds of Business.</h2>
            <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>From exhausting manual entries to silent, automated precision.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 160 }}>
            
            {/* Split 1: The Chaos (Dark, Chaotic Red/Orange Vibe) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 60, flexWrap: 'wrap' }}>
              <motion.div 
                initial={{ opacity: 0, x: -60, rotateY: -20 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ flex: '1 1 400px', perspective: 1000 }}
              >
                <div style={{
                  width: '100%', height: 460, borderRadius: 32, background: 'rgba(15, 10, 20, 0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  border: '1px solid rgba(244, 96, 123, 0.1)', overflow: 'hidden',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.5), inset 0 0 100px rgba(244,96,123,0.05)'
                }}>
                  {/* Floating chaotic elements */}
                  <motion.div animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity }} style={{ position: 'absolute', top: '15%', left: '15%', background: '#1a1114', padding: '12px 24px', borderRadius: 16, border: '1px solid rgba(244,96,123,0.2)', color: '#f4607b', fontWeight: 600 }}>Message unread...</motion.div>
                  <motion.div animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 1 }} style={{ position: 'absolute', bottom: '20%', right: '10%', background: '#1a1114', padding: '12px 24px', borderRadius: 16, border: '1px solid rgba(244,96,123,0.2)', color: '#f4607b', fontWeight: 600 }}>Total mismatch</motion.div>
                  <MessageSquare size={100} color="rgba(244, 96, 123, 0.4)" strokeWidth={1} style={{ position: 'relative', zIndex: 1 }} />
                  <div style={{ position: 'absolute', width: '150%', height: '150%', background: 'radial-gradient(circle, rgba(244,96,123,0.1) 0%, transparent 60%)', zIndex: 0 }} />
                </div>
              </motion.div>
              <div style={{ flex: '1 1 400px' }}>
                <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#f4607b', fontWeight: 800 }}>The Problem</span>
                <h3 style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 800, margin: '16px 0 24px', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Chaos in your inbox.</h3>
                <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontWeight: 500 }}>Dozens of unstructured WhatsApp messages. Calculating totals by hand. Forgetting who still owes money. The friction of traditional local commerce is exhausting and holds your scaling back.</p>
              </div>
            </div>

            {/* Split 2: The Vaani Reality (Clean, Teal/Indigo Glass Vibe) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 60, flexWrap: 'wrap-reverse' }}>
              <div style={{ flex: '1 1 400px' }}>
                <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#00e5c3', fontWeight: 800 }}>The Reality</span>
                <h3 style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 800, margin: '16px 0 24px', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Just speak to it.</h3>
                <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontWeight: 500 }}>What if a simple voice note could instantly deduct local stock, create an itemized PDF bill, and update your personal Khata ledger? We bypassed the typing and made it reality.</p>
              </div>
              <motion.div 
                initial={{ opacity: 0, x: 60, rotateY: 20 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ flex: '1 1 400px', perspective: 1000 }}
              >
                <div style={{
                  width: '100%', height: 460, borderRadius: 32, background: 'rgba(10, 15, 25, 0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  border: '1px solid rgba(0, 229, 195, 0.15)', overflow: 'hidden',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.5), inset 0 0 100px rgba(0,229,195,0.05)'
                }}>
                  <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', width: 400, height: 400, background: 'conic-gradient(from 0deg, rgba(0,229,195,0.2) 0deg, rgba(129,140,248,0.2) 180deg, rgba(0,229,195,0.2) 360deg)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />
                  
                  <div style={{ position: 'relative', zIndex: 1, background: '#0a0f18', padding: 40, borderRadius: '50%', border: '1px solid rgba(0,229,195,0.3)', boxShadow: '0 0 40px rgba(0, 229, 195, 0.2)' }}>
                    <Mic size={64} color="#00e5c3" strokeWidth={1.5} />
                  </div>

                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} style={{ position: 'absolute', bottom: 40, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: 999, color: '#fff', fontWeight: 600, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <CheckCircle2 color="#00e5c3" size={18} /> Order Generated 
                  </motion.div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* --- GLASS BENTO FEATURES GRID --- */}
      <section style={{ padding: '160px 24px', background: '#04080f' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 100 }}>
            <h2 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 24px' }}>The Architecture of Ease.</h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>Not just an app. A complete autonomous ecosystem designed for modern local merchants.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {[
              { title: 'AI Voice Parsing', icon: <Mic size={28} />, desc: 'Simply speak complex orders. We extract items, quantities, and map prices automatically.' },
              { title: 'Dynamic PDFs', icon: <FileText size={28} />, desc: 'Branded, itemized invoices generated instantly. Outshines handwriting every single time.' },
              { title: 'Live Inventory', icon: <Package size={28} />, desc: 'No more over-selling. Items deduct the second an order drops in the background.' },
              { title: 'Payment Ledgers', icon: <TrendingUp size={28} />, desc: 'UPI links injected straight into PDFs. Digital Khata marks exact dates of payment clearance.' },
              { title: 'Multi-Tenant Scale', icon: <ShieldCheck size={28} />, desc: 'Fully isolated Row-Level-Security on Supabase guarantees your data is yours alone.' }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  padding: 40, borderRadius: 32,
                  border: '1px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: 0, right: 0, width: 150, height: 150, background: 'radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e5c3', marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
                  {f.icon}
                </div>
                <h4 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>{f.title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontSize: 16 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ELEGANT CTA FOOTER --- */}
      <footer style={{ background: '#020408', color: '#fff', padding: '120px 24px 60px', position: 'relative', overflow: 'hidden' }}>
        <motion.div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 800, height: 800, background: 'radial-gradient(circle, rgba(0,229,195,0.05) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0 }} />
        
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, margin: '0 0 40px', letterSpacing: '-0.04em' }}>Your storefront,<br/>ignited.</h2>
          
          <Link href="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            background: '#fff', color: '#000',
            padding: '20px 48px', borderRadius: 999, fontSize: 16, fontWeight: 800,
            textDecoration: 'none', transition: 'all 0.3s',
            boxShadow: '0 20px 40px rgba(255,255,255,0.1)'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 24px 50px rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(255,255,255,0.1)' }}
          >
            Access the Platform <ArrowRight size={18} />
          </Link>
          
          <div style={{ marginTop: 120, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14 }}>B</div>
              <span style={{ fontWeight: 800, color: '#fff', fontSize: 18 }}>BusinessVaani.</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500 }}>
              &copy; {new Date().getFullYear()} BusinessVaani Tech. The Future of Commerce.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}