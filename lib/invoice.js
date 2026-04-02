import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

export async function POST(req) {
  try {
    const { orderId, phone } = await req.json()

    // 🧾 1. Get order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 🧾 2. Get business profile (for branding)
    const { data: business } = await supabase
      .from('business_profiles')
      .select('*')
      .limit(1)
      .single()

    // 📄 3. Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' })

    const fileName = `invoice-${orderId}.pdf`
    const filePath = path.join(process.cwd(), 'public', fileName)

    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    // =========================
    // 🏢 HEADER (Logo + Name)
    // =========================

    const themeColor = '#1e293b'

    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor(themeColor)
      .text(business?.business_name || 'My Store', { align: 'left' })

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(business?.whatsapp_number ? `WhatsApp: ${business.whatsapp_number}` : '', { align: 'left' })

    doc.moveDown(2)

    // =========================
    // 📋 ORDER INFO
    // =========================

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor(themeColor)
      .text('INVOICE', { align: 'right', continued: true })

    doc.moveUp()

    doc.fontSize(10).font('Helvetica').fillColor('#000')
    doc.text(`Order ID: #${orderId}`)
    doc.text(`Customer Info: ${phone}`)
    doc.text(`Date Output: ${new Date().toLocaleDateString('en-IN')}`)

    doc.moveDown(2)

    // =========================
    // 🛒 ITEMS TABLE (Itemized Prices)
    // =========================

    // Headers
    doc.font('Helvetica-Bold').fontSize(11).fillColor(themeColor)
    doc.text('Item Description', 50, doc.y, { continued: true })
    doc.text('Qty', 300, doc.y, { continued: true })
    doc.text('Price/Unit', 380, doc.y, { continued: true })
    doc.text('Total', 480, doc.y)
    
    doc.moveTo(50, doc.y + 5).lineTo(540, doc.y + 5).stroke('#cbd5e1')
    doc.moveDown(1.5)

    doc.font('Helvetica').fontSize(11).fillColor('#334155')

    let computedTotal = 0

    order.items.forEach((item, i) => {
      const price = item.price || 0
      const qty = item.quantity || 1
      const lineTotal = price * qty
      computedTotal += lineTotal

      doc.text(item.name || 'Unknown Item', 50, doc.y, { width: 230, continued: true })
      doc.text(`${qty} ${item.unit || 'pcs'}`, 300, doc.y, { width: 60, align: 'left', continued: true })
      doc.text(`Rs. ${price}`, 380, doc.y, { width: 80, align: 'left', continued: true })
      doc.text(`Rs. ${lineTotal}`, 480, doc.y, { width: 60, align: 'left' })
      doc.moveDown(0.8)
    })

    doc.moveTo(50, doc.y + 10).lineTo(540, doc.y + 10).stroke('#cbd5e1')
    doc.moveDown(1.5)

    // =========================
    // 💰 TOTAL
    // =========================

    const finalTotal = order.total_amount || computedTotal

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(themeColor)
      .text(`Total Amount: Rs. ${finalTotal}`, { align: 'right' })

    if (business?.upi_id) {
       doc.moveDown(1)
       doc.fontSize(10).font('Helvetica').fillColor('#64748b')
       doc.text(`Pay via UPI: ${business.upi_id}`, { align: 'right' })
    }

    doc.moveDown(3)

    // Footer
    doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .fillColor('#94a3b8')
      .text(business?.invoice_footer || 'Thank you for your business. We hope to see you again!', { align: 'center' })

    doc.end()

    // wait for file to finish
    await new Promise(resolve => stream.on('finish', resolve))

    // 🌐 4. PUBLIC URL (ngrok)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const invoiceUrl = `${baseUrl}/${fileName}`

    // 🧾 5. Save invoice in DB
    await supabase.from('invoices').insert({
      order_id: orderId,
      pdf_url: invoiceUrl,
      sent_at: new Date()
    })

    // 🔄 6. Update order status
    await supabase
      .from('orders')
      .update({ status: 'invoiced' })
      .eq('id', orderId)

    // 📲 7. Send WhatsApp
    await sendWhatsApp(
      phone,
      `🧾 Invoice ready!\n\nOrder #${orderId}\nDownload: ${invoiceUrl}`
    )

    return NextResponse.json({
      success: true,
      invoiceUrl
    })

  } catch (err) {
    console.error('Invoice error:', err)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}