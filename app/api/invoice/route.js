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
    const subtotal   = Number(order.total_amount) || 0
    const cgst       = +(subtotal * 0.09).toFixed(2)
    const sgst       = +(subtotal * 0.09).toFixed(2)
    const grandTotal = +(subtotal + cgst + sgst).toFixed(2)

    // 3. Normalize phone to E.164 format for Razorpay
    const rawPhone    = phone || order.customer_phone || ''
    const contactPhone = rawPhone.startsWith('+') ? rawPhone : `+91${rawPhone}`

    // 4. Razorpay payment link
    let paymentLink = null
    try {
      const razorpayOrder = await razorpay.paymentLink.create({
        amount: Math.round(grandTotal * 100), // paise
        currency: 'INR',
        accept_partial: false,
        description: `Invoice INV-${String(orderId).padStart(4, '0')} — Vaani Order`,
        customer: { contact: contactPhone },
        notify: { sms: false, email: false },
        reminder_enable: false,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/razorpay`,
        callback_method: 'get',
        notes: { order_id: String(orderId) },
      })
      paymentLink = razorpayOrder.short_url
    } catch (err) {
      console.error('Razorpay error:', err.message)
      paymentLink = null
    }

    // 5. Save payment link + status to order
    await supabase
      .from('orders')
      .update({
        status: 'invoiced',
        payment_link: paymentLink,
        invoice_sent_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // 6. Generate PDF invoice (use /tmp for serverless compatibility)
    const invoicesDir = '/tmp'
    const fileName    = `invoice-${orderId}.pdf`
    const filePath    = path.join(invoicesDir, fileName)

    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf')
    const hasFonts = fs.existsSync(fontPath)
    const doc      = new PDFDocument({ margin: 50, ...(hasFonts ? { font: fontPath } : {}) })
    const stream   = fs.createWriteStream(filePath)
    doc.pipe(stream)

    // ── PDF Layout ────────────────────────────────────────────

    // Header bar
    doc.rect(0, 0, doc.page.width, 100).fill('#0f1623')
    doc.fillColor('#00e5c3').fontSize(26).font('Helvetica-Bold')
      .text('TAX INVOICE', 50, 30, { align: 'left' })
    doc.fillColor('#8498b4').fontSize(11).font('Helvetica')
      .text('Vaani — WhatsApp Business AI', 50, 65)
    doc.fillColor('#00e5c3').fontSize(11)
      .text(`INV-${String(orderId).padStart(4, '0')}`, 450, 65, { align: 'right', width: 100 })
    doc.fillColor('#000000').moveDown(4.5)

    // Meta info
    const now = new Date()
    doc.fontSize(11).fillColor('#475569')
    doc.text(`Invoice No  :  INV-${String(orderId).padStart(4, '0')}`, { lineGap: 6 })
    doc.text(
      `Date        :  ${now.toLocaleString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })}`,
      { lineGap: 6 }
    )
    doc.text(`Customer    :  ${order.customer_phone}`, { lineGap: 6 })
    doc.moveDown()

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke()
    doc.moveDown()

    // Items table header
    doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold')
    doc.text('ITEM', 50, doc.y)
    doc.text('QTY',        330, doc.y - doc.currentLineHeight(), { width: 80,  align: 'right' })
    doc.text('UNIT PRICE', 410, doc.y - doc.currentLineHeight(), { width: 80,  align: 'right' })
    doc.text('TOTAL',      460, doc.y - doc.currentLineHeight(), { width: 90,  align: 'right' })
    doc.moveDown(0.4)
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
    doc.moveDown(0.6)

    // Items rows
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica')
    ;(order.items || []).forEach((item, i) => {
      const unitPrice = Number(item.price    || 0)
      const qty       = Number(item.quantity || 1)
      const lineTotal = +(unitPrice * qty).toFixed(2)
      const y = doc.y
      doc.text(`${i + 1}. ${item.name}`,       50,  y, { width: 280 })
      doc.text(`×${qty}`,                       330, y, { width: 80,  align: 'right' })
      doc.text(`₹${unitPrice.toFixed(2)}`,      410, y, { width: 80,  align: 'right' })
      doc.text(`₹${lineTotal.toFixed(2)}`,      460, y, { width: 90,  align: 'right' })
      doc.moveDown(0.7)
    })

    doc.moveDown(0.5)
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
    doc.moveDown()

    // Totals section
    const totalsX = 360
    ;[
      { label: 'Subtotal',   value: `₹${subtotal.toFixed(2)}`, color: '#475569' },
      { label: 'CGST (9%)', value: `₹${cgst.toFixed(2)}`,     color: '#818cf8' },
      { label: 'SGST (9%)', value: `₹${sgst.toFixed(2)}`,     color: '#818cf8' },
    ].forEach(row => {
      const y = doc.y
      doc.fillColor(row.color).fontSize(11)
      doc.text(row.label,  totalsX, y, { width: 100 })
      doc.text(row.value,  460,     y, { width: 90, align: 'right' })
      doc.moveDown(0.5)
    })

    doc.moveTo(totalsX, doc.y).lineTo(550, doc.y).strokeColor('#94a3b8').lineWidth(0.8).stroke()
    doc.moveDown(0.5)

    const grandY = doc.y
    doc.fillColor('#0f1623').fontSize(13).font('Helvetica-Bold')
      .text('Grand Total', totalsX, grandY, { width: 100 })
    doc.fillColor('#00e5c3')
      .text(`₹${grandTotal.toFixed(2)}`, 460, grandY, { width: 90, align: 'right' })

    // Payment link box
    if (paymentLink) {
      doc.moveDown(2)
      doc.rect(50, doc.y, doc.page.width - 100, 60).fill('#f0fdf8')
      const boxY = doc.y + 10
      doc.fillColor('#0f766e').fontSize(11).font('Helvetica-Bold')
        .text('Pay Online:', 65, boxY)
      doc.fillColor('#0d9488').fontSize(10).font('Helvetica')
        .text(paymentLink, 65, boxY + 18, { width: doc.page.width - 130 })
    }

    doc.end()
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve)
      stream.on('error', reject)
    })

    // 7. Upload PDF to Supabase Storage
    let pdfPublicUrl = null
    try {
      const fileBuffer = fs.readFileSync(filePath)
      const storagePath = `invoice-${orderId}.pdf`

      const { error: uploadError } = await supabase.storage
        .from('invoices') // make sure this bucket exists and is public in Supabase
        .upload(storagePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError.message)
      } else {
        const { data: urlData } = supabase.storage
          .from('invoices')
          .getPublicUrl(storagePath)
        pdfPublicUrl = urlData?.publicUrl || null
      }
    } catch (err) {
      console.error('PDF upload failed:', err.message)
    } finally {
      // Clean up /tmp file
      try { fs.unlinkSync(filePath) } catch (_) {}
    }

    // 8. Send WhatsApp message (with PDF as media attachment if available)
    const itemsList = (order.items || [])
      .map(i => `  • ${i.name} ×${i.quantity}`)
      .join('\n')

    const msg = [
      `🧾 *Invoice INV-${String(orderId).padStart(4, '0')}*`,
      ``,
      `*Vaani Business*`,
      `────────────────`,
      itemsList,
      `────────────────`,
      `Subtotal : ₹${subtotal.toFixed(2)}`,
      `CGST 9%  : ₹${cgst.toFixed(2)}`,
      `SGST 9%  : ₹${sgst.toFixed(2)}`,
      `*Grand Total: ₹${grandTotal.toFixed(2)}*`,
      ``,
      paymentLink
        ? `💳 *Pay securely:*\n${paymentLink}`
        : `Please pay ₹${grandTotal.toFixed(2)} at delivery.`,
      ``,
      `Thank you for your order! 🙏`,
    ].join('\n')

    await sendWhatsApp(contactPhone, msg, pdfPublicUrl)

    return NextResponse.json({ success: true, paymentLink, grandTotal, pdfPublicUrl })
  } catch (err) {
    console.error('Invoice error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}