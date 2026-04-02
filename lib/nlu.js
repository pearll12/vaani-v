import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function extractOrder(message) {
  const prompt = `
You are an AI assistant for Indian small businesses (Vaani).

Extract structured data from WhatsApp messages. Messages can be in Hindi, Hinglish, Tamil, Telugu, Marathi, Gujarati, or English.

MESSAGE: "${message}"

Return ONLY valid JSON. No explanation.

Schema:
{
  "intent": "ORDER" | "INVOICE" | "INQUIRY" | "CATALOG" | "GREETING" | "SELECTION" | "PAYMENT_STATUS" | "HELP" | "TRACK" | "CONFIRM" | "CANCEL" | "OTHER",
  "language": "hindi" | "tamil" | "telugu" | "marathi" | "gujarati" | "english" | "hinglish",
  "customerName": string | null,
  "items": [
    {
      "name": string,
      "quantity": number,
      "unit": "pcs" | "kg" | "g" | "L" | "ml" | "box" | "pack" | "dozen" | "bundle",
      "notes": string
    }
  ],
  "deliveryNote": string,
  "deliveryDate": string | null,
  "specialInstructions": string | null,
  "selectedNumbers": number[] | null,
  "confidence": number,
  "estimatedTotal": number
}

Intent Rules:
- "GREETING" for hi/hello/namaste/hii etc.
- "CATALOG" if user asks "dikhao", "catalog", "kya kya hai", "naye designs", "products", "list dikhao", "price list", "menu", "kya milta hai", "stock status", "available kya hai"
- "INQUIRY" if user asks about price, availability, or general questions
- "ORDER" only if clearly placing an order (e.g. "5 rice bag bhejdo", "send me 10 pcs")
- "SELECTION" if message is just numbers like "1,3,5" or "main 1 aur 3 lunga" or "pehla aur teesra"
- "INVOICE" if user asks for bill/invoice/receipt
- "PAYMENT_STATUS" if user asks about payment status or says "paid kar diya" or "hisab" or "khata"
- "HELP" if user asks for help, commands, guide, or "kya kar sakte hain", "help", "madad"
- "TRACK" if user asks to track order, "mera order kahan hai", "status batao", "track", "order status"
- "CONFIRM" if user says "confirm", "haan", "yes", "ok confirm", "pakka", "done", "theek hai confirm karo"
- "CANCEL" if user says "cancel", "cancel karo", "nahi chahiye", "cancel order", "raddh karo"
- "OTHER" for everything else

Parsing Rules:
- Detect units: "kilo", "kg", "gram", "litre", "dozen", "bundle", "packet", "box"
- Detect delivery: "kal bhejdo" → tomorrow, "aaj hi chahiye" → today
- Handle Hinglish: "5 wala red scarf" → name: "Red Scarf", qty: 5
- selectedNumbers: for SELECTION intent, extract the numbers user chose (e.g. "1, 3, 5" → [1, 3, 5])
- If user says "sab de do" or "all", selectedNumbers should be "all"
`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = response.choices[0].message.content.trim()
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    console.log('🧠 NLU result:', JSON.stringify(parsed, null, 2))
    return parsed

  } catch (err) {
    console.error('NLU error:', err)

    // 🔥 FALLBACK (important for reliability)
    const lower = message.toLowerCase().trim()

    // Greetings
    const greetings = ['hi', 'hello', 'hey', 'hii', 'helo', 'namaste', 'namaskar']
    if (greetings.includes(lower)) {
      return { intent: 'GREETING', language: 'hinglish', customerName: null, items: [], deliveryNote: '', confidence: 0.9, estimatedTotal: 0 }
    }

    // Help
    const helpKeywords = ['help', 'madad', 'guide', 'commands', 'kya kar sakte']
    if (helpKeywords.some(k => lower.includes(k))) {
      return { intent: 'HELP', language: 'hinglish', customerName: null, items: [], deliveryNote: '', confidence: 0.9, estimatedTotal: 0 }
    }

    // Track
    const trackKeywords = ['track', 'status', 'kahan hai', 'order status', 'status batao', 'tracking']
    if (trackKeywords.some(k => lower.includes(k))) {
      return { intent: 'TRACK', language: 'hinglish', customerName: null, items: [], deliveryNote: '', confidence: 0.9, estimatedTotal: 0 }
    }

    // Confirm
    const confirmKeywords = ['confirm', 'pakka', 'haan confirm', 'yes confirm', 'done']
    if (confirmKeywords.some(k => lower === k || lower.includes(k))) {
      return { intent: 'CONFIRM', language: 'hinglish', customerName: null, items: [], deliveryNote: '', confidence: 0.9, estimatedTotal: 0 }
    }

    // Cancel
    const cancelKeywords = ['cancel', 'raddh', 'nahi chahiye', 'cancel karo']
    if (cancelKeywords.some(k => lower.includes(k))) {
      return { intent: 'CANCEL', language: 'hinglish', customerName: null, items: [], deliveryNote: '', confidence: 0.9, estimatedTotal: 0 }
    }

    // Catalog keywords
    const catalogKeywords = ['catalog', 'dikhao', 'list', 'menu', 'products', 'kya hai', 'kya milta', 'stock', 'available', 'price list', 'naye', 'designs']
    if (catalogKeywords.some(k => lower.includes(k))) {
      return { intent: 'CATALOG', language: 'hinglish', customerName: null, items: [], deliveryNote: '', confidence: 0.8, estimatedTotal: 0 }
    }

    // Selection (just numbers)
    const numMatch = lower.match(/^[\d,\s\.aur and]+$/)
    if (numMatch) {
      const nums = lower.match(/\d+/g)?.map(Number) || []
      if (nums.length > 0 && nums.every(n => n <= 50)) {
        return { intent: 'SELECTION', language: 'hinglish', customerName: null, items: [], selectedNumbers: nums, deliveryNote: '', confidence: 0.8, estimatedTotal: 0 }
      }
    }

    // Invoice
    if (lower.includes('invoice') || lower.includes('bill') || lower.includes('receipt')) {
      return { intent: 'INVOICE', language: 'hinglish', customerName: null, items: [], deliveryNote: '', confidence: 0.8, estimatedTotal: 0 }
    }

    // Payment status
    if (lower.includes('hisab') || lower.includes('khata') || lower.includes('payment') || lower.includes('paid')) {
      return { intent: 'PAYMENT_STATUS', language: 'hinglish', customerName: null, items: [], deliveryNote: '', confidence: 0.8, estimatedTotal: 0 }
    }

    // Order (has number + text)
    const match = message.match(/(\d+)\s(.+)/)
    if (match) {
      return {
        intent: 'ORDER', language: 'hinglish', customerName: null,
        items: [{ name: match[2].trim(), quantity: parseInt(match[1]), unit: 'pcs', notes: '' }],
        deliveryNote: '', confidence: 0.7, estimatedTotal: 0
      }
    }

    return {
      intent: 'OTHER', language: 'hinglish', customerName: null,
      items: [], deliveryNote: '', confidence: 0.5, estimatedTotal: 0
    }
  }
}