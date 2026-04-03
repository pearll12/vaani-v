import Groq from 'groq-sdk'
import { toFile } from 'groq-sdk'

export async function transcribeVoiceNote(mediaUrl) {
    // Validate env vars early with clear error messages
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY environment variable is not set')
    }
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        throw new Error('Twilio credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN) are not set')
    }

    // Initialise client inside the function so env vars are read at call time
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    console.log(`🎙️ Downloading voice note from Twilio...`)

    // Embed credentials directly in the URL — Twilio supports this and it survives redirects
    // (Authorization header gets stripped on redirect by Node fetch, causing 403 on S3)
    const authenticatedUrl = mediaUrl.replace(
        'https://',
        `https://${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}@`
    )

    const response = await fetch(authenticatedUrl, {
        redirect: 'follow',
    })

    if (!response.ok) {
        throw new Error(`Failed to download voice note from Twilio: HTTP ${response.status} ${response.statusText}`)
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer())
    console.log(`🎙️ Voice note downloaded: ${(audioBuffer.length / 1024).toFixed(1)} KB`)

    if (audioBuffer.length < 100) {
        throw new Error(`Voice note too small (${audioBuffer.length} bytes) — may be empty or corrupt`)
    }

    // Use groq-sdk's toFile helper — works on all Node versions (avoids 'new File()' issue on Node < 20)
    const audioFile = await toFile(audioBuffer, 'voice-note.ogg', { type: 'audio/ogg' })

    console.log(`🤖 Sending to Groq Whisper for transcription...`)
    const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3-turbo',
        response_format: 'verbose_json',
        temperature: 0,
    })

    const text = transcription.text?.trim()
    const detectedLang = transcription.language || 'unknown'
    console.log(`✅ Transcribed (${detectedLang}): "${text}"`)

    if (!text) throw new Error('Whisper returned empty transcription — audio may be silent')
    return text
}