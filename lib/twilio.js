import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendWhatsApp(to, message, mediaUrl = null) {
  const from = process.env.TWILIO_WHATSAPP_NUMBER
  const formattedFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  const payload = {
    from: formattedFrom,
    to: formattedTo,
    body: message,
  }
  
  if (mediaUrl) {
    // Ensure URL is absolute and properly formatted
    const mediaUrlAbsolute = mediaUrl.startsWith('http') ? mediaUrl : `https://${mediaUrl}`
    payload.mediaUrl = mediaUrlAbsolute
    
    console.log('📎 Attaching media to WhatsApp message:', {
      mediaUrl: mediaUrlAbsolute.split('?')[0] + '?[...token...]',
      messageLength: message.length
    })
  }

  console.log('📤 Sending WhatsApp:', {
    from: formattedFrom,
    to: formattedTo,
    hasMedia: !!mediaUrl,
    messagePreview: message.substring(0, 50) + '...'
  })
  
  const result = await client.messages.create(payload)
  console.log('✅ Message created in Twilio:', { sid: result.sid, status: result.status })
  return result
}

