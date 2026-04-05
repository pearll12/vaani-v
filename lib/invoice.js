import { supabase } from './supabase'
import { sendWhatsApp } from './twilio'
import fs from 'fs'
import path from 'path'
import os from 'os'
import PDFDocument from 'pdfkit'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

/**
 * Shared utility to generate and send an invoice PDF to a customer.
 * Bypasses the need for internal HTTP calls from the webhook.
 */
export async function generateAndSendInvoice(orderId, phone) {
  try {
    // 1. Fetch order
    console.log(`📑 Invoice Utility: Processing Order #${orderId} for ${phone}`)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (!order || orderError) {
      console.error(`❌ Order #${orderId} not found in database.`, orderError)
      return { success: false, error: 'Order not found' }
    }

    // 2. Data normalization (Prices/Totals)
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
          )
          if (match) return { ...item, name: match.name, price: Number(match.price) || 0 }
          return item
        })
        subtotal = orderItems.reduce((s, i) => s + (Number(i.quantity) || 1) * (Number(i.price) || 0), 0)
        if (subtotal > 0) {
          await supabase.from('orders').update({ items: orderItems, total_amount: subtotal }).eq('id', orderId)
        }
      } catch(e) { console.error('Inventory lookup failure:', e) }
    }

    const cgst       = +(subtotal * 0.09).toFixed(2)
    const sgst       = +(subtotal * 0.09).toFixed(2)
    const grandTotal = +(subtotal + cgst + sgst).toFixed(2)

    const rawPhone     = phone || order.customer_phone || ''
    const contactPhone = rawPhone.startsWith('+') ? rawPhone : `+91${rawPhone}`

    // 3. Razorpay Payment Link
    let paymentLink = null
    try {
      console.log(`💳 Creating Razorpay payment link for Order #${orderId}...`)
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
    } catch (err) {
      console.error('❌ Razorpay error:', err.message)
    }

    // 4. Update order status
    await supabase.from('orders').update({
      status: 'invoiced',
      payment_link: paymentLink,
      invoice_sent_at: new Date().toISOString(),
    }).eq('id', orderId)

    // 5. PDF Generation
    const invoicesDir = os.tmpdir()
    const fileName = `invoice-${orderId}.pdf`
    const filePath = path.join(invoicesDir, fileName)

    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf')
    const hasFonts = fs.existsSync(fontPath)
    
    const { data: profiles } = await supabase.from('business_profiles').select('*').limit(1)
    const bProfile = profiles?.[0]
    
    const bName = bProfile?.business_name || 'BusinessVaani Hub'
    const bPhone = bProfile?.whatsapp_number || ''
    const bFooter = bProfile?.invoice_footer || 'Thank you for your business!'

    const doc = new PDFDocument({ margin: 50, size: 'A4', ...(hasFonts ? { font: fontPath } : {}) })
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    // UI Header
    doc.rect(0, 0, doc.page.width, 130).fill('#0f1623')
    doc.fillColor('#ffffff').fontSize(28).text('INVOICE', 50, 35)
    doc.fillColor('#818cf8').fontSize(14).text(bName, 50, 75)
    
    doc.fillColor('#00e5c3').fontSize(12).text(`INV-${String(orderId).padStart(4, '0')}`, 0, 35, { align: 'right' })
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 0, 55, { align: 'right' })

    // Details Block
    doc.y = 160
    doc.rect(50, doc.y, doc.page.width - 100, 80).fillAndStroke('#f8fafc', '#e2e8f0')
    doc.fillColor('#475569').fontSize(9).text('BILLED TO:', 70, doc.y + 15)
    doc.fillColor('#1e293b').fontSize(11).text(contactPhone, 70, doc.y + 30)
    if (order.address) {
      doc.fontSize(8).fillColor('#475569').text('SHIPPING ADDRESS:', 70, doc.y + 50)
      doc.fontSize(9).fillColor('#1e293b').text(order.address, 70, doc.y + 62)
    }

    // Items Table Header
    doc.y = 260
    const tableTop = doc.y
    const itemX = 70
    const qtyX = 350
    const amountX = 460

    doc.rect(50, tableTop, doc.page.width - 100, 25).fill('#0f1623')
    doc.fillColor('#ffffff').fontSize(10).font(hasFonts ? fontPath : 'Helvetica-Bold')
    doc.text('DESCRIPTION', itemX, tableTop + 7)
    doc.text('QTY', qtyX, tableTop + 7)
    doc.text('AMOUNT', amountX, tableTop + 7, { width: 90, align: 'right' })

    // Reset for rows
    doc.y = tableTop + 35
    doc.fillColor('#1e293b').font(hasFonts ? fontPath : 'Helvetica')
    
    ;(orderItems || []).forEach((item) => {
      const rowY = doc.y
      
      // Auto-page break
      if (rowY > 720) {
        doc.addPage()
        doc.y = 50
      }

      const itemQty = Number(item.quantity) || 1
      const itemPrice = Number(item.price) || 0
      const itemTotal = itemQty * itemPrice

      doc.text(item.name, itemX, rowY, { width: 250 })
      doc.text(String(itemQty), qtyX, rowY)
      doc.text(`₹${itemTotal.toLocaleString('en-IN')}`, amountX, rowY, { width: 90, align: 'right' })
      
      doc.y += Math.max(20, doc.heightOfString(item.name, { width: 250 }) + 5)
      doc.moveTo(50, doc.y - 5).lineTo(doc.page.width - 50, doc.y - 5).strokeColor('#f1f5f9').lineWidth(0.5).stroke()
      doc.y += 5
    })

    // ─── Summary Box ───
    if (doc.y > 600) {
      doc.addPage()
      doc.y = 50
    }
    
    doc.y += 20
    const summaryX = 330
    const labelX = summaryX + 15
    const valueX = summaryX + 105
    const summaryWidth = 220
    const summaryHeight = 110
    
    doc.rect(summaryX, doc.y, summaryWidth, summaryHeight).fillAndStroke('#f8fafc', '#e2e8f0')
    
    const startY = doc.y + 15
    doc.fillColor('#475569').fontSize(10).font(hasFonts ? fontPath : 'Helvetica')
    
    doc.text('Subtotal', labelX, startY)
    doc.text(`₹${Number(subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, valueX, startY, { width: 90, align: 'right' })
    
    doc.text('CGST (9%)', labelX, startY + 22)
    doc.text(`₹${Number(cgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, valueX, startY + 22, { width: 90, align: 'right' })
    
    doc.text('SGST (9%)', labelX, startY + 44)
    doc.text(`₹${Number(sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, valueX, startY + 44, { width: 90, align: 'right' })
    
    doc.moveTo(summaryX + 15, startY + 65).lineTo(summaryX + summaryWidth - 15, startY + 65).strokeColor('#e2e8f0').lineWidth(1).stroke()

    const totalY = startY + 75
    doc.fillColor('#1e293b').fontSize(12).font(hasFonts ? fontPath : 'Helvetica-Bold')
    doc.text('Grand Total', labelX, totalY)
    doc.fillColor('#00e5c3').text(`₹${Number(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, valueX, totalY, { width: 90, align: 'right' })

    if (paymentLink) {
      if (doc.y + summaryHeight > 750) {
        doc.addPage()
        doc.y = 50
      } else {
        doc.y += summaryHeight + 20
      }
      
      doc.rect(50, doc.y, doc.page.width - 100, 45).fill('#f0fdf4')
      doc.fillColor('#166534').fontSize(10).font(hasFonts ? fontPath : 'Helvetica-Bold')
      doc.text('PAYMENT LINK', 70, doc.y + 10)
      
      doc.fillColor('#15803d').fontSize(9).font(hasFonts ? fontPath : 'Helvetica')
      doc.text(`Click to pay: ${paymentLink}`, 70, doc.y + 25, {
        link: paymentLink,
        underline: true
      })
    }

    // Footer
    doc.y = doc.page.height - 50
    doc.fillColor('#94a3b8').fontSize(8).font(hasFonts ? fontPath : 'Helvetica').text(bFooter, 50, doc.y, { align: 'center' })

    doc.end()
    await new Promise(res => stream.on('finish', res))

    // Upload to Supabase Storage
    const fileBuffer = fs.readFileSync(filePath)
    await supabase.storage.from('invoices').upload(`invoice-${orderId}.pdf`, fileBuffer, { upsert: true, contentType: 'application/pdf' })

    const { data: signedUrl } = await supabase.storage.from('invoices').createSignedUrl(`invoice-${orderId}.pdf`, 7 * 24 * 60 * 60)

    // WhatsApp Dispatch
    await sendWhatsApp(
      contactPhone,
      `🧾 *Invoice Ready* 📄\n\nOrder: #${orderId}\nAmount: ₹${grandTotal}\n\n${paymentLink ? `💳 Pay now: ${paymentLink}` : ''}\n\n🚚 *Track your order:* Send "track ${orderId}"\n\nThank you! 🙏 — BusinessVaani`,
      signedUrl.signedUrl
    )

    console.log(`✅ Invoice sent for Order #${orderId}`)
    return { success: true, pdfUrl: signedUrl.signedUrl, paymentUrl: paymentLink }

  } catch (err) {
    console.error(`❌ Invoice generation failed:`, err)
    return { success: false, error: err.message }
  }
}