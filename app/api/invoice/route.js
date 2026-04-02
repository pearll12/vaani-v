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

    // 2. If total_amount is 0, try to fill prices from inventory
    let orderItems = order.items || []
    let subtotal = Number(order.total_amount) || 0

    if (subtotal <= 0) {
      try {
        const invPath = path.join(process.cwd(), 'data', 'inventory.json')
        const inventory = JSON.parse(fs.readFileSync(invPath, 'utf-8'))
        orderItems = orderItems.map(item => {
          if (Number(item.price) > 0) return item
          const itemNameLower = (item.name || '').toLowerCase().trim()
          const match = inventory.find(inv =>
            (inv.name || '').toLowerCase().trim() === itemNameLower
          ) || inventory.find(inv => {
            const invName = (inv.name || '').toLowerCase().trim()
            return invName.includes(itemNameLower) || itemNameLower.includes(invName)
          }) || inventory.find(inv => {
            const invName = (inv.name || '').toLowerCase().trim()
            return itemNameLower.split(/\s+/).some(w => w.length > 2 && invName.includes(w))
          })
          if (match) return { ...item, name: match.name, price: Number(match.price) || 0 }
          return item
        })
        subtotal = orderItems.reduce((s, i) => s + (Number(i.quantity) || 1) * (Number(i.price) || 0), 0)
        // Update order in DB with correct prices
        if (subtotal > 0) {
          await supabase.from('orders').update({ items: orderItems, total_amount: subtotal }).eq('id', orderId)
        }
      } catch(e) { console.error('Inventory lookup for invoice:', e) }
    }

    if (subtotal <= 0) {
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

    // 5. PDF generation
    const invoicesDir = '/tmp'
    const fileName    = `invoice-${orderId}.pdf`
    const filePath    = path.join(invoicesDir, fileName)

    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf')
    const hasFonts = fs.existsSync(fontPath)
    
    // Fetch business profile (using first available for now or default)
    const { data: profiles } = await supabase.from('business_profiles').select('*').limit(1)
    const bProfile = (profiles && profiles.length > 0) ? profiles[0] : null
    
    const bName = bProfile?.business_name || 'Vaani Business Hub'
    const bPhone = bProfile?.whatsapp_number || ''
    const bFooter = bProfile?.invoice_footer || 'Thank you for your business!'

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      ...(hasFonts ? { font: fontPath } : {})
    })
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    // Vibrant Modern Header Gradient
    const headerHeight = 130
    
    // Top Bar Background
    doc.rect(0, 0, doc.page.width, headerHeight).fill('#0f1623')
    
    // Abstract Graphic element
    doc.save()
    doc.circle(doc.page.width - 50, 40, 150).fillOpacity(0.05).fill('#00e5c3')
    doc.circle(doc.page.width, 100, 100).fillOpacity(0.05).fill('#818cf8')
    doc.restore()

    // Business Name & Title
    doc.fillColor('#ffffff').fontSize(28)
    if (hasFonts) doc.font(fontPath)
    doc.text('INVOICE', 50, 35)

    doc.fillColor('#818cf8').fontSize(14)
    doc.text(bName, 50, 75)
    
    if (bPhone) {
      doc.fillColor('#94a3b8').fontSize(10)
      doc.text(`WhatsApp: ${bPhone}`, 50, 95)
    }

    // Invoice Details Box (Top Right)
    doc.fillColor('#00e5c3').fontSize(12)
    doc.text(`INV-${String(orderId).padStart(4, '0')}`, doc.page.width - 200, 35, { align: 'right', width: 150 })
    
    const now = new Date()
    doc.fillColor('#94a3b8').fontSize(10)
    doc.text(`Date: ${now.toLocaleDateString('en-IN')}`, doc.page.width - 200, 55, { align: 'right', width: 150 })
    doc.text(`Time: ${now.toLocaleTimeString('en-IN')}`, doc.page.width - 200, 70, { align: 'right', width: 150 })

    doc.fillColor('#000000').moveDown(3)

    // Customer Detail Section
    doc.y = headerHeight + 30
    doc.rect(50, doc.y, doc.page.width - 100, 70).fillAndStroke('#f8fafc', '#e2e8f0')
    doc.fillColor('#475569').fontSize(9)
    doc.text('BILLED TO:', 70, doc.y + 15)
    doc.fillColor('#0f1623').fontSize(12)
    doc.text(contactPhone, 70, doc.y + 35)
    doc.y += 80

    // ITEMS HEADER
    doc.rect(50, doc.y, doc.page.width - 100, 30).fill('#0f1623')
    doc.fillColor('#ffffff').fontSize(10)
    if (hasFonts) doc.font(fontPath)

    doc.text('DESCRIPTION', 70, doc.y + 10)
    doc.text('QTY', 300, doc.y + 10, { width: 60, align: 'center' })
    doc.text('PRICE', 370, doc.y + 10, { width: 80, align: 'right' })
    doc.text('AMOUNT', 460, doc.y + 10, { width: 70, align: 'right' })

    doc.y += 35

    // ITEMS
    doc.fillColor('#1e293b').fontSize(11)

    ;(orderItems || []).forEach((item, i) => {
      const qty = Number(item.quantity || 1)
      const price = Number(item.price || 0)
      const total = qty * price

      // Zebra striping
      if (i % 2 !== 0) {
        doc.rect(50, doc.y - 5, doc.page.width - 100, 25).fill('#f8fafc')
        doc.fillColor('#1e293b')
      }

      doc.text(`${item.name}`, 70, doc.y)
      doc.text(`${qty}`, 300, doc.y - 12, { width: 60, align: 'center' })
      doc.text(`₹${price}`, 370, doc.y - 12, { width: 80, align: 'right' })
      doc.text(`₹${total}`, 460, doc.y - 12, { width: 70, align: 'right' })
      doc.moveDown(0.8)
    })

    // Divider
    doc.moveDown()
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#e2e8f0').stroke()
    doc.moveDown()

    // TOTALS SECTION
    const totalsY = doc.y + 10
    doc.rect(doc.page.width - 280, totalsY, 230, 100).fillAndStroke('#f8fafc', '#e2e8f0')
    
    doc.fillColor('#475569').fontSize(10)
    doc.text('Subtotal:', doc.page.width - 260, totalsY + 15)
    doc.text(`₹${subtotal}`, doc.page.width - 150, totalsY + 15, { width: 80, align: 'right' })

    doc.text('CGST (9%):', doc.page.width - 260, totalsY + 35)
    doc.text(`₹${cgst}`, doc.page.width - 150, totalsY + 35, { width: 80, align: 'right' })
    
    doc.text('SGST (9%):', doc.page.width - 260, totalsY + 55)
    doc.text(`₹${sgst}`, doc.page.width - 150, totalsY + 55, { width: 80, align: 'right' })

    doc.moveTo(doc.page.width - 260, totalsY + 75).lineTo(doc.page.width - 70, totalsY + 75).strokeColor('#cbd5e1').stroke()

    doc.fillColor('#0f1623').fontSize(12)
    doc.text('Grand Total:', doc.page.width - 260, totalsY + 85)
    doc.fillColor('#00e5c3').fontSize(14)
    doc.text(`₹${grandTotal}`, doc.page.width - 150, totalsY + 83, { width: 80, align: 'right' })

    // PAYMENT INSTRUCTIONS
    if (paymentLink) {
      doc.y = totalsY + 130
      doc.rect(50, doc.y, doc.page.width - 100, 60).fill('#ecfdf5').stroke('#a7f3d0')
      doc.fillColor('#065f46').fontSize(10)
      doc.text('PAYMENT LINK', 70, doc.y + 15)
      doc.fillColor('#059669').fontSize(11)
      doc.text(`Click here to pay or use UI below: ${paymentLink}`, 70, doc.y + 35)
    }

    // FOOTER
    doc.y = doc.page.height - 80
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#e2e8f0').stroke()
    doc.fillColor('#94a3b8').fontSize(9)
    doc.text(bFooter, 50, doc.y + 15, { align: 'center' })
    doc.text('Generated by Vaani Business AI', 50, doc.y + 30, { align: 'center' })

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