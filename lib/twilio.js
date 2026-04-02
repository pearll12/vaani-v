import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendWhatsApp(to, message, mediaUrl = null) {
  const payload = {
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: `whatsapp:${to}`,
    body: message,
  }
  if (mediaUrl) payload.mediaUrl = [mediaUrl]
  
  return await client.messages.create(payload)
}

