import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendWhatsApp(to, message, mediaUrl = null) {
  const from = process.env.TWILIO_WHATSAPP_NUMBER
  const formattedFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`

  const payload = {
    from: formattedFrom,
    to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    body: message,
  }
  if (mediaUrl) payload.mediaUrl = [mediaUrl]

  
  return await client.messages.create(payload)
}

