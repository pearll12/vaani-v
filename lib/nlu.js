import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function extractOrder(message) {
  const prompt = `
You are an AI assistant for Indian small businesses.

Extract structured data from WhatsApp messages.

MESSAGE: "${message}"

Return ONLY valid JSON. No explanation.

Schema:
{
  "intent": "ORDER" | "INVOICE" | "INQUIRY" | "OTHER",
  "language": "hindi" | "tamil" | "telugu" | "marathi" | "gujarati" | "english" | "hinglish",
  "customerName": string | null,
  "items": [
    {
      "name": string,
      "quantity": number,
      "unit": "pcs"
    }
  ],
  "deliveryNote": string,
  "confidence": number,
  "estimatedTotal": number
}

Rules:
- "INVOICE" if user asks for bill/invoice/receipt
- "ORDER" only if clearly placing order
- "items" empty if not order
- customerName should be null unless clearly given
- detect Hinglish properly
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
    const lower = message.toLowerCase()

    if (
      lower.includes('invoice') ||
      lower.includes('bill') ||
      lower.includes('receipt')
    ) {
      return {
        intent: 'INVOICE',
        language: 'hinglish',
        customerName: null,
        items: [],
        deliveryNote: '',
        confidence: 0.8,
        estimatedTotal: 0
      }
    }

    const match = message.match(/(\d+)\s(.+)/)

    if (match) {
      return {
        intent: 'ORDER',
        language: 'hinglish',
        customerName: null,
        items: [
          {
            name: match[2],
            quantity: parseInt(match[1]),
            unit: 'pcs'
          }
        ],
        deliveryNote: '',
        confidence: 0.7,
        estimatedTotal: 0
      }
    }

    return {
      intent: 'OTHER',
      language: 'hinglish',
      customerName: null,
      items: [],
      deliveryNote: '',
      confidence: 0.5,
      estimatedTotal: 0
    }
  }
}