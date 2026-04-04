import PDFDocument from 'pdfkit'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function generateAndUploadCataloguePDF(inventory) {
  return new Promise(async (resolve, reject) => {
    try {
      const invoicesDir = os.tmpdir()
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true })
      }
      const fileName = `catalogue-${Date.now()}.pdf`
      const filePath = path.join(invoicesDir, fileName)

      const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf')
      const hasFonts = fs.existsSync(fontPath)

      const doc = new PDFDocument({ margin: 40, size: 'A4', ...(hasFonts ? { font: fontPath } : {}) })
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      // Header
      doc.rect(0, 0, doc.page.width, 100).fill('#0f1623')
      doc.fillColor('#ffffff').fontSize(24)
      if (hasFonts) doc.font(fontPath)
      doc.text('INVENTORY CATALOGUE', 40, 35)

      const now = new Date()
      doc.fillColor('#94a3b8').fontSize(10)
      doc.text(`Generated: ${now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`, doc.page.width - 200, 45, { align: 'right', width: 160 })

      doc.fillColor('#000000').moveDown(3)

      let currentY = 120

      // Group by category
      const categories = {}
      inventory.forEach(item => {
        if (Number(item.quantity) <= 0) return // Skip out of stock
        const cat = item.category || 'General'
        if (!categories[cat]) categories[cat] = []
        categories[cat].push(item)
      })

      doc.y = currentY

      for (const [cat, items] of Object.entries(categories)) {
        if (doc.y > doc.page.height - 100) doc.addPage()
        
        // Category Header
        doc.rect(40, doc.y, doc.page.width - 80, 25).fill('#1e293b')
        doc.fillColor('#ffffff').fontSize(12)
        doc.text(cat.toUpperCase(), 50, doc.y + 7)
        doc.y += 25

        // Items
        items.forEach((item, i) => {
          if (doc.y > doc.page.height - 50) doc.addPage()
          
          if (i % 2 !== 0) {
            doc.rect(40, doc.y, doc.page.width - 80, 20).fill('#f8fafc')
          }
          doc.fillColor('#0f1623').fontSize(10)
          
          const price = Number(item.price) || 0
          doc.text(item.name, 50, doc.y + 5)
          doc.text(`₹${price} / ${item.unit}`, doc.page.width - 150, doc.y + 5, { width: 100, align: 'right' })
          doc.y += 20
        })

        doc.y += 15
      }

      doc.end()

      await new Promise(res => stream.on('finish', res))

      // Upload to Supabase
      const fileBuffer = fs.readFileSync(filePath)
      const storagePath = `catalogues/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(storagePath, fileBuffer, { upsert: true, contentType: 'application/pdf' })

      if (uploadError) throw new Error(uploadError.message)

      // Get short-lived signed URL to give to Twilio
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from('invoices')
        .createSignedUrl(storagePath, 7 * 24 * 60 * 60)

      if (signedError) {
        const { data } = supabase.storage.from('invoices').getPublicUrl(storagePath)
        resolve(data.publicUrl)
      } else {
        resolve(signedUrlData.signedUrl)
      }

    } catch (err) {
      console.error('PDF Generation Error:', err)
      reject(err)
    }
  })
}
