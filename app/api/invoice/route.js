import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export async function POST(req) {
  try {
    const { orderId, phone } = await req.json()

    // 1. Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (!order || orderError) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 2. GST Calculation
    const subtotal = Number(order.total_amount)

if (!subtotal || subtotal <= 0) {
  console.error("❌ Invalid amount:", order.total_amount)
}
    const cgst       = +(subtotal * 0.09).toFixed(2)
    const sgst       = +(subtotal * 0.09).toFixed(2)
    const grandTotal = +(subtotal + cgst + sgst).toFixed(2)

    // 3. Normalize phone
    const rawPhone     = phone || order.customer_phone || ''
    const contactPhone = rawPhone.startsWith('+') ? rawPhone : `+91${rawPhone}`

    // 4. Razorpay link
    let paymentLink = null
    try {
      const razorpayOrder = await razorpay.paymentLink.create({
        amount: Math.round(grandTotal * 100),
        currency: 'INR',
        accept_partial: false,
        description: `Invoice INV-${String(orderId).padStart(4, '0')}`,
        customer: { contact: contactPhone },
        notify: { sms: false, email: false },
        reminder_enable: false,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/razorpay`,
        callback_method: 'get',
        notes: { order_id: String(orderId) },
      })
      paymentLink = razorpayOrder.short_url
    } catch (err) {
      console.error('Razorpay error:', JSON.stringify(err, null, 2))
    }

    // 5. Update order
    await supabase
      .from('orders')
      .update({
        status: 'invoiced',
        payment_link: paymentLink,
        invoice_sent_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // 6. PDF generation
    const invoicesDir = '/tmp'
    const fileName    = `invoice-${orderId}.pdf`
    const filePath    = path.join(invoicesDir, fileName)

    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf')
    const hasFonts = fs.existsSync(fontPath)
    const doc = new PDFDocument({
      margin: 50,
      ...(hasFonts ? { font: fontPath } : {})
    })
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    // HEADER
    doc.rect(0, 0, doc.page.width, 100).fill('#0f1623')

    doc.fillColor('#00e5c3').fontSize(26)
    if (hasFonts) doc.font(fontPath)
    doc.text('TAX INVOICE', 50, 30)

    doc.fillColor('#8498b4').fontSize(11)
    if (hasFonts) doc.font(fontPath)
    doc.text('Vaani — WhatsApp Business AI', 50, 65)

    doc.fillColor('#00e5c3').fontSize(11)
    doc.text(`INV-${String(orderId).padStart(4, '0')}`, 450, 65, { align: 'right', width: 100 })

    doc.fillColor('#000000').moveDown(4.5)

    // META
    const now = new Date()
    doc.fontSize(11).fillColor('#475569')
    if (hasFonts) doc.font(fontPath)

    doc.text(`Invoice No  : INV-${String(orderId).padStart(4, '0')}`)
    doc.text(`Date        : ${now.toLocaleString('en-IN')}`)
    doc.text(`Customer    : ${order.customer_phone}`)

    doc.moveDown()

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()

    doc.moveDown()

    // ITEMS HEADER
    doc.fillColor('#64748b').fontSize(9)
    if (hasFonts) doc.font(fontPath)

    doc.text('ITEM', 50, doc.y)
    doc.text('QTY', 330, doc.y, { width: 80, align: 'right' })
    doc.text('UNIT PRICE', 410, doc.y, { width: 80, align: 'right' })
    doc.text('TOTAL', 460, doc.y, { width: 90, align: 'right' })

    doc.moveDown()

    // ITEMS
    doc.fillColor('#1e293b').fontSize(11)
    if (hasFonts) doc.font(fontPath)

    ;(order.items || []).forEach((item, i) => {
      const qty = Number(item.quantity || 1)
      const price = Number(item.price || 0)
      const total = qty * price

      doc.text(`${i + 1}. ${item.name}`, 50)
      doc.text(`×${qty}`, 330, doc.y - 15, { align: 'right' })
      doc.text(`₹${price}`, 410, doc.y - 15, { align: 'right' })
      doc.text(`₹${total}`, 460, doc.y - 15, { align: 'right' })
      doc.moveDown()
    })

    doc.moveDown()

    // TOTAL
    doc.fillColor('#0f1623').fontSize(13)
    if (hasFonts) doc.font(fontPath)

    doc.text(`Grand Total: ₹${grandTotal}`, { align: 'right' })

    // PAYMENT LINK
    if (paymentLink) {
      doc.moveDown()
      doc.fillColor('#0d9488').fontSize(10)
      if (hasFonts) doc.font(fontPath)
      doc.text(`Pay: ${paymentLink}`)
    }

    doc.end()

    await new Promise(res => stream.on('finish', res))

    // Upload to Supabase
    const fileBuffer = fs.readFileSync(filePath)
    const storagePath = `invoice-${orderId}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(storagePath, fileBuffer, { upsert: true })

    let pdfPublicUrl = null
    if (!uploadError) {
      const { data } = supabase.storage
        .from('invoices')
        .getPublicUrl(storagePath)
      pdfPublicUrl = data.publicUrl
    }

    // WhatsApp
    await sendWhatsApp(
      contactPhone,
      `🧾 Invoice ready\nOrder #${orderId}\n${paymentLink || ''}`,
      pdfPublicUrl
    )

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Invoice error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}