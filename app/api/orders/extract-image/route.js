// Extract order information from customer photos using Claude Vision API
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req) {
  try {
    const { imageBase64, phone, customerName } = await req.json()

    if (!imageBase64 || !phone) {
      return NextResponse.json({ 
        error: 'Missing image or phone number' 
      }, { status: 400 })
    }

    console.log('📸 Processing order image for:', phone)

    // Call Claude Vision API to extract text from image
    const extractionResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64.split(',')[1] || imageBase64,
                },
              },
              {
                type: 'text',
                text: `Extract the order information from this image. Convert it into a JSON format with this structure:
{
  "items": [
    {"name": "item name", "quantity": number, "price": number},
    ...
  ],
  "notes": "any additional notes"
}

Only return valid JSON, no explanations. If no order is found, return: {"error": "No order found in image"}`,
              },
            ],
          },
        ],
      }),
    })

    if (!extractionResponse.ok) {
      const errorData = await extractionResponse.json()
      console.error('❌ Claude Vision API error:', errorData)
      return NextResponse.json({ 
        error: 'Failed to extract order from image',
        details: errorData
      }, { status: 500 })
    }

    const extractionData = await extractionResponse.json()
    const extractedText = extractionData.content[0]?.text || ''

    console.log('📝 Extracted text:', extractedText)

    // Parse JSON from response
    let orderData
    try {
      // Extract JSON from response (might include markdown formatting)
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      orderData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(extractedText)
    } catch (e) {
      console.error('❌ Failed to parse extracted order:', e)
      return NextResponse.json({ 
        error: 'Could not parse order from image. Please describe the order in text instead.',
        rawText: extractedText
      }, { status: 400 })
    }

    if (orderData.error) {
      return NextResponse.json({ 
        error: orderData.error,
        rawText: extractedText
      }, { status: 400 })
    }

    // Calculate totals
    const subtotal = (orderData.items || []).reduce((sum, item) => {
      return sum + ((item.quantity || 1) * (item.price || 0))
    }, 0)

    const cgst = +(subtotal * 0.09).toFixed(2)
    const sgst = +(subtotal * 0.09).toFixed(2)
    const total = +(subtotal + cgst + sgst).toFixed(2)

    console.log('✅ Order extracted successfully:', { items: orderData.items?.length, total })

    return NextResponse.json({
      success: true,
      order: {
        items: orderData.items || [],
        notes: orderData.notes || '',
        subtotal,
        cgst,
        sgst,
        total,
        language: 'image',
        timestamp: new Date().toISOString(),
      },
      message: `📸 Order extracted! Found ${orderData.items?.length || 0} items, Total: ₹${total}`
    })

  } catch (err) {
    console.error('🔴 Server error:', err)
    return NextResponse.json({ 
      error: 'Server error processing image',
      details: err.message
    }, { status: 500 })
  }
}
