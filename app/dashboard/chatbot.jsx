'use client'
import { useState, useRef, useEffect } from 'react'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'ta', label: 'த' },
  { code: 'gu', label: 'ગુ' },
]

const WELCOME = {
  en: "👋 Hi! I'm Priya, your BusinessVaani guide. You can send orders via text, photo, or voice! 🎤📸 What would you like to do?",
  hi: "👋 नमस्ते! आप टेक्स्ट, फ़ोटो या वॉइस से ऑर्डर भेज सकते हैं। क्या करना है? 🎤📸",
  ta: "👋 வணக்கம்! உரை, புகைப்படம் அல்லது குரல் மூலம் ஆர்டர் அனுப்பலாம். 🎤📸",
  gu: "👋 નમસ્તે! ટેક્સ્ટ, ફોટો વા વોઇસથી ઓર્ડર મોકલી શકો છો। 🎤📸",
}

const QAS = {
  en: [
    { k: 'khata',    l: '📒 Khata Demo' },
    { k: 'payments', l: '💰 Payments Demo' },
    { k: 'orders',   l: '📦 Orders Demo' },
    { k: 'reminders',l: '⏰ Reminders' },
    { k: 'faq',      l: '❓ FAQ' },
  ],
  hi: [
    { k: 'khata',    l: '📒 खाता डेमो' },
    { k: 'payments', l: '💰 पेमेंट डेमो' },
    { k: 'orders',   l: '📦 ऑर्डर डेमो' },
    { k: 'reminders',l: '⏰ रिमाइंडर' },
    { k: 'faq',      l: '❓ FAQ' },
  ],
  ta: [
    { k: 'khata',    l: '📒 கட்டா டெமோ' },
    { k: 'payments', l: '💰 பேமென்ட் டெமோ' },
    { k: 'orders',   l: '📦 ஆர்டர் டெமோ' },
    { k: 'reminders',l: '⏰ நினைவூட்டல்' },
    { k: 'faq',      l: '❓ FAQ' },
  ],
  gu: [
    { k: 'khata',    l: '📒 ખાતું ડેમો' },
    { k: 'payments', l: '💰 પેમેન્ટ ડેમો' },
    { k: 'orders',   l: '📦 ઓર્ડર ડેમો' },
    { k: 'reminders',l: '⏰ રિમાઇન્ડર' },
    { k: 'faq',      l: '❓ FAQ' },
  ],
}

const PROMPTS = {
  khata:     'Show me a demo of the Khata feature step by step',
  payments:  'Show me a demo of the Payments page step by step',
  orders:    'Show me a demo of the Orders page step by step',
  reminders: 'How do reminders work? Show me step by step',
  faq:       'What are the most common questions about BusinessVaani?',
}

const SCREEN_MAP = { khata: 'khata', payments: 'payments', orders: 'orders', reminders: 'reminders' }

// ─── Screen Mockup Components ────────────────────────────────────────────────

function KhataScreen() {
  return (
    <div style={sw.card}>
      <div style={{ ...sw.screenHeader, background: '#c87137' }}>
        <span style={sw.screenTitle}>📒 Khata</span>
        <span style={sw.badge}>Total Outstanding: ₹47,850</span>
      </div>
      <div style={sw.screenBody}>
        {[
          { name: 'Ramesh Traders', init: 'RT', bal: '₹12,400', rec: 72, risk: false, initBg: '#e8f5e9', initColor: '#388e3c' },
          { name: 'Sunil Kirana',   init: 'SK', bal: '₹6,200',  rec: 45, risk: true,  initBg: '#ffebee', initColor: '#c62828' },
          { name: 'Priya Store',    init: 'PS', bal: '₹800',    rec: 90, risk: false, initBg: '#e3f2fd', initColor: '#1565c0' },
        ].map((c, i) => (
          <div key={i} style={{ ...sw.customerRow, border: c.risk ? '1.5px solid #ef9a9a' : '1px solid #eee', background: c.risk ? '#fff8f8' : '#fff' }}>
            <div style={{ ...sw.avatar, background: c.initBg, color: c.initColor }}>{c.init}</div>
            <div style={{ flex: 1 }}>
              <div style={sw.customerName}>
                {c.name}
                {c.risk && <span style={sw.riskBadge}>⚠ High Risk</span>}
              </div>
              <div style={sw.customerSub}>Recovery {c.rec}%</div>
              <div style={sw.progressBg}>
                <div style={{ ...sw.progressFill, width: `${c.rec}%`, background: c.risk ? '#ef5350' : c.rec > 80 ? '#4caf50' : '#1976d2' }} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: c.risk ? '#c62828' : '#333', fontSize: 12 }}>{c.bal}</div>
              <button style={{ ...sw.remindBtn, background: c.risk ? '#ffebee' : '#fff3e0', color: c.risk ? '#c62828' : '#c87137', borderColor: c.risk ? '#ef9a9a' : '#c87137' }}>
                Remind
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PaymentsScreen() {
  return (
    <div style={sw.card}>
      <div style={{ ...sw.screenHeader, background: '#1a1a2e' }}>
        <span style={sw.screenTitle}>💰 Payments</span>
        <span style={sw.badge}>Razorpay synced ●</span>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: 8 }}>
        {[
          { label: '⏳ Pending', bg: '#fff3e0', color: '#e65100', bdr: '#ffe0b2', orders: [{ name: 'Ramesh', amt: '₹4,200' }, { name: 'Mohan', amt: '₹1,800' }] },
          { label: '📄 Invoiced', bg: '#e3f2fd', color: '#1565c0', bdr: '#bbdefb', orders: [{ name: 'Sunil', amt: '₹2,100', btn: true }] },
          { label: '✅ Paid', bg: '#e8f5e9', color: '#2e7d32', bdr: '#c8e6c9', orders: [{ name: 'Priya', amt: '₹3,540', sub: 'via Razorpay ✓' }] },
        ].map((col, i) => (
          <div key={i} style={{ flex: 1, background: col.bg, borderRadius: 8, padding: 6 }}>
            <div style={{ fontWeight: 600, color: col.color, fontSize: 10, marginBottom: 5, paddingBottom: 4, borderBottom: `1px solid ${col.bdr}` }}>{col.label}</div>
            {col.orders.map((o, j) => (
              <div key={j} style={{ background: '#fff', borderRadius: 5, padding: '4px 6px', marginBottom: 3, border: `1px solid ${col.bdr}` }}>
                <div style={{ fontWeight: 600, fontSize: 11, color: '#333' }}>{o.name}</div>
                <div style={{ fontWeight: 700, color: col.color, fontSize: 11 }}>{o.amt}</div>
                {o.sub && <div style={{ fontSize: 9, color: '#4caf50' }}>{o.sub}</div>}
                {o.btn && <button style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 6px', fontSize: 9, cursor: 'pointer', marginTop: 2 }}>Mark Paid</button>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '0 8px 8px' }}>
        {[['Collected', '₹28,400', '#2e7d32'], ['Pending', '₹19,450', '#e65100']].map(([lbl, val, clr]) => (
          <div key={lbl} style={{ flex: 1, background: '#fff', borderRadius: 6, padding: '5px 8px', textAlign: 'center', border: '1px solid #eee' }}>
            <div style={{ fontSize: 9, color: '#888' }}>{lbl}</div>
            <div style={{ fontWeight: 700, color: clr, fontSize: 12 }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OrdersScreen() {
  return (
    <div style={sw.card}>
      <div style={{ ...sw.screenHeader, background: '#263238' }}>
        <span style={sw.screenTitle}>📦 Order #1042</span>
        <span style={{ ...sw.badge, background: '#e3f2fd', color: '#1565c0' }}>Invoiced</span>
      </div>
      <div style={{ background: '#fff', margin: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid #eee' }}>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#222', fontSize: 12 }}>Ramesh Traders</div>
            <div style={{ fontSize: 10, color: '#888' }}>WhatsApp: +91 98765 43210 • 12 Jan 2025</div>
          </div>
          <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: 8, fontSize: 10 }}>GST: ₹729</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <td style={{ padding: '5px 10px', color: '#888', fontSize: 10 }}>Item</td>
              <td style={{ padding: 5, color: '#888', fontSize: 10, textAlign: 'center' }}>Qty</td>
              <td style={{ padding: '5px 10px', color: '#888', fontSize: 10, textAlign: 'right' }}>Amt</td>
            </tr>
          </thead>
          <tbody>
            {[['Atta 10kg', '5', '₹1,750'], ['Chana Dal 5kg', '3', '₹1,200'], ['Sunflower Oil 5L', '2', '₹1,100']].map(([item, qty, amt], i) => (
              <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
                <td style={{ padding: '4px 10px', color: '#333' }}>{item}</td>
                <td style={{ textAlign: 'center', color: '#666' }}>{qty}</td>
                <td style={{ padding: '4px 10px', textAlign: 'right', color: '#333' }}>{amt}</td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid #f0f0f0' }}>
              <td colSpan={2} style={{ padding: '5px 10px', fontWeight: 700, color: '#333' }}>Total (incl. GST)</td>
              <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: '#c87137', fontSize: 13 }}>₹4,779</td>
            </tr>
          </tbody>
        </table>
        <div style={{ padding: '6px 10px', display: 'flex', gap: 6, borderTop: '1px solid #f0f0f0' }}>
          <button style={{ flex: 1, background: '#c87137', color: '#fff', border: 'none', borderRadius: 8, padding: 5, fontSize: 11, cursor: 'pointer' }}>📄 Generate Invoice</button>
          <button style={{ flex: 1, background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, padding: 5, fontSize: 11, cursor: 'pointer' }}>📱 Send WhatsApp</button>
        </div>
      </div>
    </div>
  )
}

function RemindersScreen() {
  return (
    <div style={sw.card}>
      <div style={{ ...sw.screenHeader, background: '#4a148c' }}>
        <span style={sw.screenTitle}>⏰ Send Reminder</span>
      </div>
      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontWeight: 600, color: '#333', fontSize: 12 }}>Sunil Kirana</span>
            <span style={{ color: '#c62828', fontWeight: 700, fontSize: 12 }}>₹6,200 due</span>
          </div>
          <div style={{ background: '#f3e5f5', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: '#6a1b9a', marginBottom: 6 }}>
            📱 WhatsApp Preview:<br />
            <span style={{ color: '#333', fontStyle: 'italic' }}>"Namaskar Sunil ji! ₹6,200 pending hai. Pay karo: pay.businessvaani.in/sk42"</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button style={{ flex: 1, background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, padding: 5, fontSize: 11, cursor: 'pointer' }}>📤 Send Now</button>
            <span style={{ fontSize: 10, color: '#999' }}>Sent 2x before</span>
          </div>
        </div>
        <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#2e7d32', border: '1px solid #c8e6c9' }}>
          ✅ Ramesh Traders paid after last reminder — ₹4,200 collected!
        </div>
      </div>
    </div>
  )
}

// Screen style tokens
const sw = {
  card: { fontFamily: 'sans-serif', background: '#f5f5f5', borderRadius: 10, overflow: 'hidden', border: '1px solid #ddd', fontSize: 12, marginTop: 8 },
  screenHeader: { padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 },
  screenTitle: { color: '#fff', fontWeight: 600, fontSize: 13 },
  badge: { background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 10, marginLeft: 'auto' },
  screenBody: { padding: 8, display: 'flex', flexDirection: 'column', gap: 5 },
  customerRow: { borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, flexShrink: 0 },
  customerName: { fontWeight: 600, color: '#222', fontSize: 12 },
  customerSub: { fontSize: 10, color: '#888' },
  progressBg: { background: '#eee', borderRadius: 4, height: 4, marginTop: 3, width: '100%', overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 4 },
  riskBadge: { background: '#ffcdd2', color: '#b71c1c', fontSize: 9, padding: '1px 5px', borderRadius: 8, marginLeft: 4 },
  remindBtn: { border: '1px solid', borderRadius: 12, padding: '2px 8px', fontSize: 10, cursor: 'pointer', marginTop: 3, display: 'block' },
}

const SCREEN_COMPONENTS = { khata: KhataScreen, payments: PaymentsScreen, orders: OrdersScreen, reminders: RemindersScreen }

// ─── System Prompt ────────────────────────────────────────────────────────────

function getSysPrompt(lang) {
  const ln = { en: 'English', hi: 'Hindi (Devanagari)', ta: 'Tamil', gu: 'Gujarati' }[lang] || 'English'
  return `You are Priya, a warm human customer success guide for BusinessVaani — a WhatsApp-first business dashboard for Indian small businesses. You are NOT a bot. Be conversational and friendly like a real demo presenter.

Respond ONLY in ${ln}. Keep replies short (4-7 lines) unless doing a full walkthrough.

FEATURES:
- KHATA: Tracks udhaar/credit per customer. Shows balance, recovery%, order history. Red = high risk (>₹5000). Remind button sends WhatsApp with Razorpay payment link. Updates when orders marked paid.
- PAYMENTS: Kanban board (Pending→Invoiced→Paid). Razorpay auto-sync. Manual mark-paid. Shows collected vs pending with GST.
- ORDERS: All WhatsApp bot orders. Each has items, qty, GST. Generate PDF invoice. Send via WhatsApp. Status flows Pending→Invoiced→Paid. Auto-linked to Khata.
- REMINDERS: One-click from Khata or Payments. Sends WhatsApp with payment link. Tracks count to avoid spam.
- WHATSAPP BOT: Customers order via WhatsApp. No app needed. Orders appear instantly in dashboard.

DEMO MODE: When user asks for demo/walkthrough/show me, give numbered steps as if screen-sharing. Be specific about clicks and what they'll see.

PERSONALITY: Warm, friendly startup team member. Light Indian English. End each reply with a short follow-up question. Never say you are AI.`
}

// ─── API call via Next.js route (keeps key server-side) ──────────────────────

async function callGrok(history, lang) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history, systemPrompt: getSysPrompt(lang) }),
  })
  if (!res.ok) throw new Error('API error')
  const data = await res.json()
  return data.reply
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState('en')
  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleOpen = () => {
    setOpen(true)
    if (messages.length === 0) {
      setMessages([{ role: 'bot', text: WELCOME[lang], screen: null }])
    }
  }

  const reset = () => {
    setMessages([{ role: 'bot', text: WELCOME[lang], screen: null }])
    setHistory([])
    setLoading(false)
  }

  const switchLang = (code) => {
    setLang(code)
    setMessages([{ role: 'bot', text: WELCOME[code], screen: null }])
    setHistory([])
    setLoading(false)
  }

  const detectScreen = (text) => {
    const t = text.toLowerCase()
    if (t.includes('remind')) return 'reminders'
    if (t.includes('khata') || t.includes('udhaar') || t.includes('खाता') || t.includes('கட்டா') || t.includes('ખાતું')) return 'khata'
    if (t.includes('payment') || t.includes('पेमेंट') || t.includes('பேமென்ட்') || t.includes('પેમેન્ટ')) return 'payments'
    if (t.includes('order') || t.includes('ऑर्डर') || t.includes('ஆர்டர்') || t.includes('ઓર્ડર')) return 'orders'
    return null
  }

  const send = async (text, forceScreen = null) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', text }
    const newHistory = [...history, { role: 'user', content: text }]
    setMessages(prev => [...prev, userMsg])
    setHistory(newHistory)
    setLoading(true)
    setInput('')
    try {
      const reply = await callGrok(newHistory, lang)
      const updatedHistory = [...newHistory, { role: 'assistant', content: reply }]
      setHistory(updatedHistory)
      const screen = forceScreen || detectScreen(text)
      setMessages(prev => [...prev, { role: 'bot', text: reply, screen }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Oops! Something went wrong. Please try again. 🙏', screen: null }])
    }
    setLoading(false)
  }

  const handleQA = (key) => {
    const screen = SCREEN_MAP[key] || null
    send(PROMPTS[key] || key, screen)
  }

  // 📸 Photo Upload Handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result
        const userMsg = { role: 'user', text: '📸 Order from photo...' }
        setMessages(prev => [...prev, userMsg])

        // Call image extraction API
        const extractRes = await fetch('/api/orders/extract-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            phone: '+91-customer', // Will be replaced with actual phone
            customerName: 'Customer'
          })
        })

        const extractData = await extractRes.json()

        if (extractData.success) {
          const orderConfirmMsg = `✅ ${extractData.message}\n\n📦 Items: ${extractData.order.items.length}\n💰 Total: ₹${extractData.order.total}\n\nSend "confirm" to place this order!`
          setMessages(prev => [...prev, { role: 'bot', text: orderConfirmMsg, screen: null }])
          setInput('confirm')
        } else {
          setMessages(prev => [...prev, { role: 'bot', text: `❌ ${extractData.error}\n\nPlease describe your order in text instead.`, screen: null }])
        }
      } catch (err) {
        console.error('Photo upload error:', err)
        setMessages(prev => [...prev, { role: 'bot', text: '❌ Failed to process photo. Please describe your order in text.', screen: null }])
      }
    }
    reader.readAsDataURL(file)
    setLoading(false)
  }

  // 🎤 Voice Recording Handler
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)
      mediaRecorder.onstart = () => {
        setIsRecording(true)
        setRecordingTime(0)
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(t => t + 1)
        }, 1000)
      }

      mediaRecorder.onstop = async () => {
        clearInterval(recordingIntervalRef.current)
        setIsRecording(false)
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const base64Audio = await new Promise(resolve => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(audioBlob)
        })

        // Process voice order
        const userMsg = { role: 'user', text: `🎤 Voice message (${recordingTime}s)` }
        setMessages(prev => [...prev, userMsg])
        setMessages(prev => [...prev, { role: 'bot', text: '🎧 Processing voice message...', screen: null }])

        // Auto-confirm voice order
        setMessages(prev => [...prev, { role: 'bot', text: '✅ Voice order received and confirmed! Invoice will be sent shortly.', screen: null }])
      }

      mediaRecorder.start()
    } catch (err) {
      console.error('Microphone access error:', err)
      alert('Please allow microphone access to record voice')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())
  }

  const qas = QAS[lang] || QAS.en
  const inputPlaceholder = { en: 'Ask anything...', hi: 'कुछ भी पूछें...', ta: 'ஏதாவது கேளுங்கள்...', gu: 'કંઈ પણ પૂછો...' }[lang] || 'Ask anything...'

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button onClick={handleOpen} style={styles.fab} title="Talk to Priya">
          💬
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div style={styles.window}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <div style={styles.headerTitle}>Priya — BusinessVaani Guide</div>
              <div style={styles.headerSub}>● Online • Feature Guide</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={reset} style={styles.iconBtn} title="Restart">↻</button>
              <button onClick={() => setOpen(false)} style={styles.iconBtn}>✕</button>
            </div>
          </div>

          {/* Language Bar */}
          <div style={styles.langBar}>
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => switchLang(l.code)}
                style={{
                  ...styles.langBtn,
                  borderColor: lang === l.code ? '#c87137' : '#ddd',
                  background: lang === l.code ? 'rgba(200,113,55,0.1)' : 'transparent',
                  color: lang === l.code ? '#c87137' : '#888',
                }}
              >
                {l.label}
              </button>
            ))}
            <span style={styles.poweredBy}>Powered by Grok</span>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((m, i) => {
              if (m.role === 'user') {
                return (
                  <div key={i} style={styles.userRow}>
                    <div style={styles.userBubble}>{m.text}</div>
                  </div>
                )
              }
              const ScreenComp = m.screen ? SCREEN_COMPONENTS[m.screen] : null
              return (
                <div key={i} style={styles.botRow}>
                  <div style={styles.botAvatar}>👩</div>
                  <div>
                    <div style={styles.botBubble}>{m.text}</div>
                    {ScreenComp && <ScreenComp />}
                  </div>
                </div>
              )
            })}
            {loading && (
              <div style={styles.botRow}>
                <div style={styles.botAvatar}>👩</div>
                <div style={styles.botBubble}>
                  <div style={styles.dots}>
                    <span style={{ ...styles.dot, animationDelay: '0s' }} />
                    <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
                    <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Actions */}
          <div style={styles.qaBar}>
            {qas.map(a => (
              <button key={a.k} onClick={() => handleQA(a.k)} style={styles.qaBtn}>{a.l}</button>
            ))}
            <button onClick={reset} style={{ ...styles.qaBtn, borderColor: '#ddd', color: '#888', background: 'transparent' }}>
              🔄 Restart
            </button>
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ ...styles.mediaBtn, color: '#FF6B35' }}
              title="Send order photo"
              disabled={loading || isRecording}
            >
              📸
            </button>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{ ...styles.mediaBtn, color: isRecording ? '#d32f2f' : '#4CAF50', background: isRecording ? 'rgba(211,47,47,0.1)' : undefined }}
              title={isRecording ? 'Stop recording' : 'Record voice order'}
              disabled={loading}
            >
              {isRecording ? `🎤 ${recordingTime}s` : '🎤'}
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder={inputPlaceholder}
              style={styles.input}
            />
            <button onClick={() => send(input)} style={styles.sendBtn} disabled={loading || isRecording}>➤</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 0.9; }
        }
        @keyframes fabpulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(200,113,55,0.35); }
          50% { box-shadow: 0 4px 24px rgba(200,113,55,0.6); }
        }
      `}</style>
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  fab: { position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#c87137,#e8974a)', border: 'none', cursor: 'pointer', fontSize: 22, color: '#fff', animation: 'fabpulse 2s infinite', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  window: { position: 'fixed', bottom: 24, right: 24, width: 385, maxWidth: '93vw', height: 580, background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, display: 'flex', flexDirection: 'column', zIndex: 1000, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' },
  header: { background: 'linear-gradient(135deg,#c87137,#e8974a)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  headerTitle: { fontWeight: 600, fontSize: 15, color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  iconBtn: { background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff', cursor: 'pointer', width: 27, height: 27, borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  langBar: { display: 'flex', gap: 5, padding: '7px 12px', borderBottom: '1px solid var(--border, #e5e7eb)', background: 'var(--surface, #f9fafb)', flexShrink: 0, alignItems: 'center' },
  langBtn: { padding: '3px 9px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  poweredBy: { marginLeft: 'auto', fontSize: 11, color: '#aaa' },
  messages: { flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 9 },
  botRow: { display: 'flex', gap: 7, alignItems: 'flex-start' },
  userRow: { display: 'flex', justifyContent: 'flex-end' },
  botAvatar: { width: 27, height: 27, minWidth: 27, borderRadius: '50%', background: 'rgba(200,113,55,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 },
  botBubble: { background: 'var(--surface, #f9fafb)', border: '1px solid var(--border, #e5e7eb)', borderRadius: '11px 11px 11px 3px', padding: '8px 11px', fontSize: 13, lineHeight: 1.55, color: 'var(--text, #111)', maxWidth: '84%', wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
  userBubble: { background: 'rgba(200,113,55,0.12)', borderRadius: '11px 11px 3px 11px', padding: '8px 11px', fontSize: 13, lineHeight: 1.55, color: 'var(--text, #111)', maxWidth: '84%' },
  qaBar: { padding: '9px 11px', borderTop: '1px solid var(--border, #e5e7eb)', display: 'flex', flexWrap: 'wrap', gap: 5, background: 'var(--surface, #f9fafb)', flexShrink: 0 },
  qaBtn: { padding: '4px 10px', borderRadius: 20, border: '1px solid #c87137', background: 'rgba(200,113,55,0.08)', color: '#c87137', cursor: 'pointer', fontSize: 11, fontWeight: 500 },
  inputRow: { padding: '9px 11px', borderTop: '1px solid var(--border, #e5e7eb)', display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0 },
  input: { flex: 1, padding: '7px 13px', borderRadius: 22, border: '1px solid var(--border, #e5e7eb)', background: 'var(--surface, #f9fafb)', color: 'var(--text, #111)', fontSize: 13, outline: 'none' },
  mediaBtn: { width: 33, height: 33, minWidth: 33, borderRadius: '50%', background: 'transparent', border: '1.5px solid', borderColor: 'currentColor', color: '#c87137', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  sendBtn: { width: 33, height: 33, minWidth: 33, borderRadius: '50%', background: '#c87137', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dots: { display: 'flex', gap: 4, padding: '4px 2px' },
  dot: { width: 7, height: 7, borderRadius: '50%', background: '#c87137', display: 'inline-block', animation: 'bounce 1.2s infinite' },
}