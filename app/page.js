'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import {
  MessageSquare,
  Mic,
  Zap,
  Shield,
  Smartphone,
  Globe,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

export default function LandingPage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Animation variants
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden">
      {/* --- NAVBAR --- */}
      <nav style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(2, 6, 23, 0.7)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="/logo.png"
              alt="BusinessVaani"
              style={{ width: 40, height: 40, objectFit: 'contain' }}
            />
            <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Business<span style={{ color: '#6366f1' }}>Vaani</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: '0.9rem', fontWeight: 500, color: '#94a3b8' }} className="hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/signup" style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '0.5rem 1.25rem',
              borderRadius: 99,
              background: 'white',
              color: '#020617'
            }} className="hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION: THE TWO WORLDS --- */}
      <main style={{ paddingTop: 120, paddingBottom: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>

          {/* Header Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', marginBottom: 80 }}
          >

            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 800,
              letterSpacing: '-.04em',
              lineHeight: 1.1,
              marginBottom: 24,
              color: 'white'
            }}>
              Your Voice, <span style={{ background: 'linear-gradient(to right, #6366f1, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Organized.</span>
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
              The first AI platform that turns chaotic voice messages and WhatsApp chats into structured orders, professional invoices, and real-time inventory.
            </p>
          </motion.div>

          {/* TWO WORLDS COMPARISON FIGMA-STYLE */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginTop: 40
          }}>
            {/* World 1: The Mess (Left) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '2.5rem',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200, background: 'rgba(244, 63, 94, 0.05)', filter: 'blur(60px)', borderRadius: '50%' }} />
              <div style={{
                width: 44, height: 44,
                background: 'rgba(244, 63, 94, 0.1)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
                color: '#fb7185'
              }}>
                <MessageSquare size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: '#fecdd3' }}>The Manual Chaos</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: 32 }}>Juggling WhatsApp notes, missing paper bills, and manual inventory updates.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  "Recording order from voice memo...",
                  "Calculating CGST/SGST manually...",
                  "Checking shelf if stock exists...",
                  "Sending bank details individually..."
                ].map((item, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 12,
                    fontSize: '0.85rem',
                    color: '#e2e8f0',
                    borderLeft: '3px solid #fb7185',
                    opacity: 1 - (idx * 0.15)
                  }}>
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* World 2: The Magic (Right) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              style={{
                position: 'relative',
                background: 'rgba(99, 102, 241, 0.03)',
                borderRadius: 24,
                border: '1px solid rgba(99, 102, 241, 0.2)',
                padding: '2.5rem',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(99, 102, 241, 0.1)'
              }}
            >
              <div style={{ position: 'absolute', bottom: -50, right: -50, width: 200, height: 200, background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(60px)', borderRadius: '50%' }} />
              <div style={{
                width: 44, height: 44,
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
                color: '#818cf8'
              }}>
                <Zap size={24} fill="#818cf8" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: '#c7d2fe' }}>The BusinessVaani Flow</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: 32 }}>AI listens, understands, and automates your entire back-office in seconds.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 12,
                  fontSize: '0.85rem',
                  display: 'flex', justifyContent: 'space-between',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <span style={{ color: '#818cf8', fontWeight: 600 }}>Invoice #882 Generated</span>
                  <span style={{ color: '#fff' }}>₹12,450.00</span>
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: 12,
                  fontSize: '0.85rem',
                  display: 'flex', gap: 10, alignItems: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: '#10b981'
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  Inventory Updated Automatically
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  fontSize: '0.85rem',
                  color: '#e2e8f0'
                }}>
                  WhatsApp Payment Link Sent ✅
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* --- FEATURES GRID --- */}
      <section style={{ py: 100, background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginBottom: 16 }}>Everything you need to scale</h2>
            <p style={{ color: '#94a3b8' }}>Simple tools, enterprise-grade intelligence.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {[
              { icon: Mic, title: "Voice-to-Order", desc: "Speak naturally. Our AI extracts items, quantities, and prices automatically." },
              { icon: MessageSquare, title: "WhatsApp OS", desc: "Customers order via WhatsApp. You manage it all in one unified dashboard." },
              { icon: Shield, title: "Digital Khata", desc: "Automated ledger tracking. Know exactly who owes you what, instantly." },
              { icon: Layers, title: "Smart Inventory", desc: "Stocks sync across all orders. Get notified before you run out of bestsellers." }
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                style={{
                  padding: '2rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ color: '#6366f1', marginBottom: 20 }}>
                  <f.icon size={32} />
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>{f.title}</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section style={{ padding: '120px 2rem', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{
            maxWidth: 800,
            margin: '0 auto',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #020617 100%)',
            padding: '4rem 2rem',
            borderRadius: 32,
            border: '1px solid rgba(99, 102, 241, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent)', pointerEvents: 'none' }} />

          <h2 style={{ fontSize: '3rem', fontWeight: 800, color: 'white', marginBottom: 24, position: 'relative' }}>Ready to transform?</h2>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: 40, maxWidth: 500, margin: '0 auto 40px auto' }}>
            Join 1,000+ businesses using BusinessVaani to automate their commerce.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              background: '#6366f1',
              color: 'white',
              padding: '1rem 2.5rem',
              borderRadius: 99,
              fontWeight: 700,
              fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', gap: 10
            }} className="hover:bg-indigo-500 hover:scale-105 transition-all shadow-xl shadow-indigo-500/25">
              Get Started Free <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* --- FOOTER --- */}
      <footer style={{ padding: '60px 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 24, height: 24,
              background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={14} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 700, color: 'white' }}>BusinessVaani Hub</span>
          </div>

          <div style={{ display: 'flex', gap: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
            <a href="#" className="hover:text-indigo-400">Documentation</a>
            <a href="#" className="hover:text-indigo-400">Support</a>
            <a href="#" className="hover:text-indigo-400">Privacy</a>
          </div>

          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} BusinessVaani. Built for the future of commerce.
          </div>
        </div>
      </footer>

      {/* --- WHATSAPP FLOATING CTA --- */}
      <motion.a
        href="https://wa.me/14155238886?text=join separate-while"
        target="_blank"
        initial={{ opacity: 0, scale: 0.8, x: 50 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        whileHover={{ scale: 1.1 }}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: '#25D366',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(37, 211, 102, 0.3)',
          cursor: 'pointer',
          zIndex: 1000,
          color: 'white',
          textDecoration: 'none'
        }}
      >
        <MessageSquare size={28} fill="white" />
        <div style={{
          position: 'absolute',
          right: '75px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '6px 14px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          Try Our AI Order Bot!
        </div>
      </motion.a>
    </div>
  )
}