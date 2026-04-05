import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import fs from 'fs'
import path from 'path'
import os from 'os'
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
    console.log(`📑 Invoice API: Processing Order #${orderId} for ${phone}`)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (!order || orderError) {
      console.error(`❌ Order #${orderId} not found in database.`, orderError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 2. If total_amount is 0, try to fill prices from inventory
    let orderItems = order.items || []
    let subtotal = Number(order.total_amount) || 0

    if (subtotal <= 0) {
      try {
        const { data: inventory } = await supabase.from('inventory').select('*')
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

    const cgst       = +(subtotal * 0.09).toFixed(2)
    const sgst       = +(subtotal * 0.09).toFixed(2)
    const grandTotal = +(subtotal + cgst + sgst).toFixed(2)

    // 3. Normalize phone
    const rawPhone     = phone || order.customer_phone || ''
    const contactPhone = rawPhone.startsWith('+') ? rawPhone : `+91${rawPhone}`

    // 4. Razorpay link
    let paymentLink = null
    try {
      console.log(`💳 Creating Razorpay payment link for ₹${grandTotal}...`)
      const razorpayOrder = await razorpay.paymentLink.create({
        amount: Math.round(grandTotal * 100),
        currency: 'INR',
        accept_partial: false,
        description: `Invoice INV-${String(orderId).padStart(4, '0')}`,
        customer: { contact: contactPhone.replace('whatsapp:', '') },
        notify: { sms: false, email: false },
        reminder_enable: false,
        notes: { order_id: String(orderId) },
      })
      paymentLink = razorpayOrder.short_url
      console.log(`✅ Razorpay link created: ${paymentLink}`)
    } catch (err) {
      console.error('❌ Razorpay error:', JSON.stringify(err, null, 2))
      // Continue even if payment link fails - we still want the invoice
    }

    // 5. Update order metadata
    await supabase
      .from('orders')
      .update({
        status: 'invoiced',
        payment_link: paymentLink,
        invoice_sent_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    console.log('--- INVOICE GENERATION START ---', { orderId, contactPhone })

    // 6. PDF generation - Use OS temp dir for serverless/Vercel compatibility
    const invoicesDir = os.tmpdir()
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true })
    }
    const fileName = `invoice-${orderId}.pdf`
    const filePath = path.join(invoicesDir, fileName)

    console.log('--- INVOICE PROCESS START ---', { orderId, contactPhone, filePath })
    
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf')
    const hasFonts = fs.existsSync(fontPath)
    
    // Fetch business profile (using first available for now or default)
    const { data: profiles } = await supabase.from('business_profiles').select('*').limit(1)
    const bProfile = (profiles && profiles.length > 0) ? profiles[0] : null
    
    const bName = bProfile?.business_name || 'BusinessVaani Hub'
    const bPhone = bProfile?.whatsapp_number || ''
    const bFooter = bProfile?.invoice_footer || 'Thank you for your business!'

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      ...(hasFonts ? { font: fontPath } : {})
    })
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    // Header Gradient UI
    const headerHeight = 130
    doc.rect(0, 0, doc.page.width, headerHeight).fill('#0f1623')
    doc.save()
    doc.circle(doc.page.width - 50, 40, 150).fillOpacity(0.05).fill('#00e5c3')
    doc.circle(doc.page.width, 100, 100).fillOpacity(0.05).fill('#818cf8')
    doc.restore()

    doc.fillColor('#ffffff').fontSize(28)
    if (hasFonts) doc.font(fontPath)
    doc.text('INVOICE', 50, 35)

    doc.fillColor('#818cf8').fontSize(14)
    doc.text(bName, 50, 75)
    
    if (bPhone) {
      doc.fillColor('#94a3b8').fontSize(10)
      doc.text(`WhatsApp: ${bPhone}`, 50, 95)
    }

    doc.fillColor('#00e5c3').fontSize(12)
    doc.text(`INV-${String(orderId).padStart(4, '0')}`, doc.page.width - 200, 35, { align: 'right', width: 150 })
    
    const now = new Date()
    doc.fillColor('#94a3b8').fontSize(10)
    doc.text(`Date: ${now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`, doc.page.width - 200, 55, { align: 'right', width: 150 })
    doc.text(`Time: ${now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`, doc.page.width - 200, 70, { align: 'right', width: 150 })

    doc.fillColor('#000000').moveDown(3)

    // Customer Detail
    doc.y = headerHeight + 30
    doc.rect(50, doc.y, doc.page.width - 100, 70).fillAndStroke('#f8fafc', '#e2e8f0')
    doc.fillColor('#475569').fontSize(9)
    doc.text('BILLED TO:', 70, doc.y + 15)
    doc.fillColor('#0f1623').fontSize(12)
    doc.text(contactPhone, 70, doc.y + 35)
    doc.y += 80

    // Headers
    doc.rect(50, doc.y, doc.page.width - 100, 30).fill('#0f1623')
    doc.fillColor('#ffffff').fontSize(10)
    doc.text('DESCRIPTION', 70, doc.y + 10)
    doc.text('QTY', 300, doc.y + 10, { width: 60, align: 'center' })
    doc.text('PRICE', 370, doc.y + 10, { width: 80, align: 'right' })
    doc.text('AMOUNT', 460, doc.y + 10, { width: 70, align: 'right' })

    doc.y += 35
    doc.fillColor('#1e293b').fontSize(11)

    // Items
    ;(orderItems || []).forEach((item, i) => {
      const qty = Number(item.quantity || 1)
      const price = Number(item.price || 0)
      const total = qty * price
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

    // Totals
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

    if (paymentLink) {
      doc.y = totalsY + 130
      doc.rect(50, doc.y, doc.page.width - 100, 60).fill('#ecfdf5').stroke('#a7f3d0')
      doc.fillColor('#065f46').fontSize(10)
      doc.text('PAYMENT LINK', 70, doc.y + 15)
      doc.fillColor('#059669').fontSize(11)
      doc.text(`Click here to pay or use UI below: ${paymentLink}`, 70, doc.y + 35)
    }

    doc.y = doc.page.height - 80
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#e2e8f0').stroke()
    doc.fillColor('#94a3b8').fontSize(9)
    doc.text(bFooter, 50, doc.y + 15, { align: 'center' })
    doc.text('Generated by BusinessVaani AI', 50, doc.y + 30, { align: 'center' })

    doc.end()
    await new Promise(res => stream.on('finish', res))
    console.log('PDF write finished.')

    // Upload to Supabase
    const fileBuffer = fs.readFileSync(filePath)
    const storagePath = `invoice-${orderId}.pdf`

    console.log('📤 Uploading to Supabase storage bucket "invoices":', storagePath, 'Size:', fileBuffer.length, 'bytes')
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(storagePath, fileBuffer, { upsert: true, contentType: 'application/pdf' })

    if (uploadError) {
      console.error('❌ Supabase upload failed. Ensure "invoices" bucket exists and is public/accessible.', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload invoice: ' + uploadError.message,
        details: uploadError
      }, { status: 500 })
    }
    console.log('✅ PDF uploaded successfully.')

    // Get signed URL valid for 7 days (more reliable than public URL)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('invoices')
      .createSignedUrl(storagePath, 7 * 24 * 60 * 60) // 7 days expiry

    if (signedError) {
      console.error('❌ Failed to create signed URL:', signedError)
      // Fallback to public URL
      const { data } = supabase.storage.from('invoices').getPublicUrl(storagePath)
      return NextResponse.json({ 
        error: 'Could not generate download URL',
        pdfUrl: data.publicUrl
      }, { status: 500 })
    }

    const pdfUrl = signedUrlData.signedUrl
    console.log('✅ Signed PDF URL generated (7-day expiry):', pdfUrl.split('?')[0] + '?...')

    // WhatsApp Dispatch - Send PDF directly
    console.log('📞 Sending WhatsApp with PDF attachment via Twilio...')
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Twilio timeout')), 15000)
      )
      
      const twilioRes = await Promise.race([
        sendWhatsApp(
          contactPhone,
          `🧾 *Invoice Ready* 📄\n\nOrder: #${orderId}\nAmount: ₹${grandTotal}\n\n📄 Download Invoice: ${pdfUrl}\n\n${paymentLink ? `💳 Pay now: ${paymentLink}` : 'Contact us for payment details'}\n\nThank you! 🙏 — BusinessVaani`,
          pdfUrl  // Send PDF directly as attachment
        ),
        timeoutPromise
      ])
      
      console.log('✅ Twilio WhatsApp sent successfully:', twilioRes.sid)
      console.log('📎 PDF attached to message')
      
    } catch (twError) {
      console.error('❌ Twilio WhatsApp Error:', twError.message, twError)
      // Don't fail the whole request if WhatsApp fails - invoice is still saved
      return NextResponse.json({ 
        success: true, 
        pdfUrl: pdfUrl,
        warning: 'Invoice created but WhatsApp send failed: ' + twError.message 
      })
    }

    return NextResponse.json({ success: true, pdfUrl: pdfUrl, delivered: true })

  } catch (err) {
    console.error('CRITICAL API ERROR DISPATCH:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}