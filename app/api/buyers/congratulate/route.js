import { NextResponse } from 'next/server'
import { sendWhatsApp } from '@/lib/twilio'

export async function POST(req) {
  try {
    const { phone, totalSpent } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const message = `🎉 Congratulations! 

You are one of our top buyers on the *Vaani Platform*! 🥳
You have successfully completed transactions worth *₹${Number(totalSpent).toLocaleString('en-IN')}*.

Thank you for being a valued customer! 🙏✨`

    const result = await sendWhatsApp(phone, message)

    return NextResponse.json({ 
      success: true, 
      sid: result.sid,
      message: 'Congratulatory message sent successfully!' 
    })
  } catch (error) {
    console.error('❌ Error sending congratulations:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to send message' 
    }, { status: 500 })
  }
}
