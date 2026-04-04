
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
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const WEBHOOK_URL = `${BASE_URL}/api/webhook`
const TEST_PHONE = '+919999000001'

const SAMPLES = {
    hindi: 'Bhai 5 kilo aata, 2 kilo chawal aur 1 kilo dal bhej do',
    english: '3 red sarees and 10 blue dupattas please',
    hinglish: 'Mujhe 4 dozen eggs aur 2 packet bread chahiye',
    tamil: '10 kg அரிசி மற்றும் 2 kg பருப்பு வேண்டும்',
    marathi: '6 किलो साखर आणि 3 किलो डाळ पाठवा',
    invoice: 'Mujhe invoice chahiye',
}

async function simulate(payload) {
    const form = new URLSearchParams(payload)
    console.log(`\n📤 POST → ${WEBHOOK_URL}`)
    console.log(`📋 Body: ${payload.Body || '(voice note)'}`)
    const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
    })
    console.log(`📥 Response: ${res.status} ${await res.text()}`)
}

async function main() {
    const args = process.argv.slice(2)
    if (args[0] === '--invoice') {
        await simulate({ From: `whatsapp:${TEST_PHONE}`, Body: SAMPLES.invoice, NumMedia: '0' })
        return
    }
    const lang = args[args.indexOf('--lang') + 1] || 'hindi'
    const text = SAMPLES[lang] || SAMPLES.hindi
    console.log(`🌐 Language: ${lang}\n📝 Message: "${text}"`)
    await simulate({ From: `whatsapp:${TEST_PHONE}`, Body: text, NumMedia: '0' })
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })