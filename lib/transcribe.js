import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function transcribeVoiceNote(mediaUrl) {
    const twilioAuth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString('base64')

    const response = await fetch(mediaUrl, {
        headers: { Authorization: `Basic ${twilioAuth}` }
    })

    if (!response.ok) {
        throw new Error(`Failed to download voice note: ${response.status}`)
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer())
    console.log(`🎙️ Voice note downloaded: ${(audioBuffer.length / 1024).toFixed(1)} KB`)

    const audioFile = new File([audioBuffer], 'voice-note.ogg', {
        type: 'audio/ogg'
    })

    const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3-turbo',
        response_format: 'verbose_json',
        temperature: 0,
    })

    const text = transcription.text?.trim()
    const detectedLang = transcription.language || 'unknown'
    console.log(`✅ Transcribed (${detectedLang}): "${text}"`)

    if (!text) throw new Error('Whisper returned empty transcription')
    return text
}