import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import { extractOrder } from '@/lib/nlu'        // next step mein banayenge

export async function POST(req) {
  try {
    const formData = await req.formData()
    
    // Twilio se aane wala data
    const from      = formData.get('From')?.replace('whatsapp:', '')
    const body      = formData.get('Body') || ''
    const numMedia  = parseInt(formData.get('NumMedia') || '0')
    const mediaUrl  = formData.get('MediaUrl0')
    const mediaType = formData.get('MediaContentType0')
    
    console.log(`📩 Message from ${from}: ${body}`)
    
    // Voice note hai ya text?
    const isVoiceNote = mediaType?.includes('audio') || mediaType?.includes('ogg')
    
    let messageText = body
    
    // Voice note → transcribe (Step 3 mein add karenge)
    if (isVoiceNote && mediaUrl) {
      messageText = await transcribeVoiceNote(mediaUrl)  
      console.log(`🎤 Transcribed: ${messageText}`)
    }

    // Sirf "hi", "hello" ignore karo
    const greetings = ['hi', 'hello', 'hey', 'hii', 'helo']
    if (greetings.includes(messageText.trim().toLowerCase())) {
      await sendWhatsApp(from, 
        `Namaste! 🙏 Vaani mein aapka swagat hai.\n\nBas apna order WhatsApp pe bhejein — hum automatically process kar denge!\n\n_Supported: Hindi, Tamil, Telugu, Marathi, English_`
      )
      return new NextResponse('OK', { status: 200 })
    }

    // NLU se order extract karo
    const extracted = await extractOrder(messageText)
    
    if (!extracted || extracted.intent !== 'ORDER') {
      // Order nahi lagta — acknowledge karo
      await sendWhatsApp(from,
        `✅ Message mila! Agar yeh order hai, thoda clearly likhein jaise:\n"5 red saree aur 2 blue dupatta bhejdo"`
      )
      return new NextResponse('OK', { status: 200 })
    }

    // Customer upsert karo
    const { data: customer } = await supabase
      .from('customers')
      .upsert({ phone: from }, { onConflict: 'phone' })
      .select()
      .single()

    // Order save karo
    const { data: order } = await supabase
      .from('orders')
      .insert({
        customer_phone: from,
        raw_message: messageText,
        items: extracted.items,
        language: extracted.language,
        status: 'pending',
        total_amount: extracted.estimatedTotal || 0,
      })
      .select()
      .single()

    console.log(`✅ Order saved: #${order.id}`)

    // Confirmation reply bhejo — SAME LANGUAGE mein
    const confirmMsg = buildConfirmation(extracted, order.id)
    await sendWhatsApp(from, confirmMsg)

    return new NextResponse('OK', { status: 200 })

  } catch (err) {
    console.error('Webhook error:', err)
    return new NextResponse('Error', { status: 500 })
  }
}

// Language-aware confirmation message
function buildConfirmation(extracted, orderId) {
  const itemList = extracted.items
    .map(i => `  • ${i.quantity}x ${i.name}`)
    .join('\n')

  const templates = {
    tamil:   `✅ Order பதிவு செய்யப்பட்டது! (#${orderId})\n\n${itemList}\n\nInvoice அனுப்புகிறோம் 🙏`,
    marathi: `✅ ऑर्डर नोंदवला! (#${orderId})\n\n${itemList}\n\nInvoice पाठवत आहोत 🙏`,
    telugu:  `✅ ఆర్డర్ నమోదు అయింది! (#${orderId})\n\n${itemList}\n\nInvoice పంపుతున్నాం 🙏`,
    hindi:   `✅ Order record ho gaya! (#${orderId})\n\n${itemList}\n\nInvoice bhej rahe hain 🙏`,
    english: `✅ Order confirmed! (#${orderId})\n\n${itemList}\n\nSending your invoice shortly 🙏`,
  }

  return templates[extracted.language] || templates.hindi
}