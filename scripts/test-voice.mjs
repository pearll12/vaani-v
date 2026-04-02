import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [k, ...v] = line.split('=')
        if (k && v.length) process.env[k.trim()] = v.join('=').trim()
    })
    console.log('✅ Loaded .env.local')
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function extractOrder(message) {
    const prompt = `You are an AI assistant for Indian small businesses.
Extract structured data from WhatsApp messages.
MESSAGE: "${message}"
Return ONLY valid JSON. No explanation. No markdown.

CRITICAL: All item names MUST be in English Roman letters only.
NEVER output Devanagari, Tamil, Telugu or any Indian script in the name field.
Transliterate: आटा=aata, चावल=chawal, दाल=dal, प्याज=pyaaz, साड़ी=saree

{
  "intent": "ORDER" | "INVOICE" | "INQUIRY" | "OTHER",
  "language": "hindi" | "tamil" | "telugu" | "marathi" | "gujarati" | "english" | "hinglish",
  "customerName": null,
  "items": [
    {
      "name": "English Roman letters ONLY - e.g. aata, chawal, dal",
      "quantity": number,
      "unit": "kg" | "pcs" | "dozen" | "litre" | "gram"
    }
  ],
  "deliveryNote": "",
  "confidence": number,
  "estimatedTotal": number
}`
    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        messages: [{ role: 'user', content: prompt }]
    })
    const text = response.choices[0].message.content.trim()
    return JSON.parse(text.replace(/```json|```/g, '').trim())
}

async function main() {
    const args = process.argv.slice(2)
    console.log('\n🎙️  Vaani Voice Note Test\n' + '─'.repeat(40))

    if (args[0] === '--text') {
        const text = args.slice(1).join(' ')
        if (!text) { console.error('Usage: --text "your order"'); process.exit(1) }
        console.log(`📝 Testing NLU: "${text}"\n`)
        const result = await extractOrder(text)
        console.log(JSON.stringify(result, null, 2))
        return
    }

    if (args[0]) {
        const audioPath = path.resolve(args[0])
        if (!fs.existsSync(audioPath)) {
            console.error(`❌ File not found: ${audioPath}`); process.exit(1)
        }
        console.log(`📁 File: ${audioPath}`)
        console.log('⏳ Transcribing...')
        const audioBuffer = fs.readFileSync(audioPath)
        const ext = path.extname(audioPath).slice(1) || 'ogg'
        const audioFile = new File([audioBuffer], `voice.${ext}`, { type: `audio/${ext}` })
        const transcription = await groq.audio.transcriptions.create({
            file: audioFile, model: 'whisper-large-v3-turbo',
            response_format: 'verbose_json', temperature: 0,
        })
        const text = transcription.text?.trim()
        console.log(`✅ Language: ${transcription.language}`)
        console.log(`📝 Text: "${text}"\n`)
        console.log('⏳ Running NLU...')
        const result = await extractOrder(text)
        console.log(JSON.stringify(result, null, 2))
        return
    }

    const samples = [
        { lang: 'Hindi', text: 'Bhai 5 kilo aata aur 2 kilo chawal bhej do' },
        { lang: 'English', text: '3 red sarees and 10 blue dupattas please' },
        { lang: 'Hinglish', text: 'Mujhe 4 dozen eggs aur 2 bread chahiye' },
        { lang: 'Tamil', text: '10 kg அரிசி மற்றும் 2 kg பருப்பு வேண்டும்' },
        { lang: 'Marathi', text: '6 किलो साखर आणि 3 किलो डाळ पाठवा' },
    ]
    for (const s of samples) {
        console.log(`\n[${s.lang}] "${s.text}"`)
        try {
            const r = await extractOrder(s.text)
            if (r.intent === 'ORDER') {
                console.log(`   ✅ Items: ${r.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`)
            } else {
                console.log(`   ⚠️  Intent: ${r.intent}`)
            }
        } catch (e) { console.log(`   ❌ ${e.message}`) }
    }
    console.log('\n✅ All tests done!')
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })