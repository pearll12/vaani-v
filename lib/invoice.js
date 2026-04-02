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

    // 🧾 2. Get customer (for branding)
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', order.customer_phone)
      .single()

    // 📄 3. Create PDF
    const doc = new PDFDocument({ margin: 50 })

    const fileName = `invoice-${orderId}.pdf`
    const filePath = path.join(process.cwd(), 'public', fileName)

    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    // =========================
    // 🏢 HEADER (Logo + Name)
    // =========================

    if (customer?.logo_url) {
      try {
        doc.image(customer.logo_url, 50, 40, { width: 80 })
      } catch (e) {
        console.log("Logo load failed")
      }
    }

    doc
      .fontSize(20)
      .text(customer?.business_name || 'My Store', 150, 50)

    doc
      .fontSize(10)
      .text('INVOICE', { align: 'right' })

    doc.moveDown(2)

    // =========================
    // 📋 ORDER INFO
    // =========================

    doc.fontSize(12)
    doc.text(`Order ID: ${orderId}`)
    doc.text(`Customer: ${order.customer_phone}`)
    doc.text(`Date: ${new Date().toLocaleString()}`)

    doc.moveDown()

    // =========================
    // 🛒 ITEMS TABLE
    // =========================

    doc.fontSize(14).text('Items', { underline: true })
    doc.moveDown(0.5)

    order.items.forEach((item, i) => {
      doc.fontSize(12).text(
        `${i + 1}. ${item.name}  —  ${item.quantity} pcs`
      )
    })

    doc.moveDown()

    // =========================
    // 💰 TOTAL
    // =========================

    const total = order.total_amount || 0

    doc
      .fontSize(14)
      .text(`Total Amount: ₹${total}`, { align: 'right' })

    doc.moveDown(2)

    doc
      .fontSize(10)
      .text('Thank you for your business 🙏', { align: 'center' })

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