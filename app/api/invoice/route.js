import { NextResponse } from 'next/server'
import { generateAndSendInvoice } from '@/lib/invoice'

/**
 * POST — Generate and send a PDF invoice to a customer via WhatsApp
 * Payload: { orderId, phone }
 */
export async function POST(req) {
  try {
    const body = await req.json()
    const { orderId, phone } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    console.log(`📑 Invoice API: Triggering generation for Order #${orderId}`)
    
    // Call the shared utility logic
    const result = await generateAndSendInvoice(orderId, phone)

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Invoice generated and sent successfully',
        pdfUrl: result.pdfUrl 
      })
    } else {
      return NextResponse.json({ 
        error: result.error || 'Failed to generate invoice' 
      }, { status: 500 })
    }

  } catch (err) {
    console.error('Invoice API POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}