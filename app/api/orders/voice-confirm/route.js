// Voice-enabled order confirmation endpoint
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req) {
  try {
    const { 
      phone, 
      orderItems, 
      notes, 
      voiceMessageUrl,
      confirmationType // 'text', 'voice', 'photo'
    } = await req.json()

    if (!phone || !orderItems || !Array.isArray(orderItems)) {
      return NextResponse.json({ 
        error: 'Missing phone or items' 
      }, { status: 400 })
    }

    console.log(`🎤 Creating order with ${confirmationType} confirmation:`, { phone, itemCount: orderItems.length })

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => {
      return sum + ((item.quantity || 1) * (item.price || 0))
    }, 0)

    const cgst = +(subtotal * 0.09).toFixed(2)
    const sgst = +(subtotal * 0.09).toFixed(2)
    const total = +(subtotal + cgst + sgst).toFixed(2)

    // Insert order into Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_phone: phone,
        items: orderItems,
        notes: notes || '',
        total_amount: total,
        subtotal,
        cgst,
        sgst,
        status: 'pending',
        confirmation_type: confirmationType,
        voice_message_url: voiceMessageUrl,
        created_at: new Date().toISOString(),
        language: 'mixed',
      })
      .select()
      .single()

    if (orderError) {
      console.error('❌ Database error:', orderError)
      return NextResponse.json({ 
        error: 'Failed to save order',
        details: orderError.message
      }, { status: 500 })
    }

    console.log('✅ Order created:', order.id)

    // Send confirmation via WhatsApp
    try {
      const confirmationMessage = `✅ *Order Confirmed!*\n\n📦 Order #${order.id}\n💰 Total: ₹${total}\nItems: ${orderItems.length}\n\n${confirmationType === 'photo' ? '📸 (Received via photo)' : ''}\n${confirmationType === 'voice' ? '🎤 (Received via voice)' : ''}\n\nWe'll send you an invoice shortly!`

      await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message: confirmationMessage,
          type: 'order_confirmation'
        })
      })

      console.log('📨 Confirmation message sent')
    } catch (e) {
      console.error('⚠️ Failed to send confirmation:', e)
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      total,
      message: `✅ Order #${order.id} confirmed! Total: ₹${total}`
    })

  } catch (err) {
    console.error('🔴 Server error:', err)
    return NextResponse.json({ 
      error: 'Server error',
      details: err.message
    }, { status: 500 })
  }
}
