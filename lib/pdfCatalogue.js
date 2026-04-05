import PDFDocument from 'pdfkit'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function generateAndUploadCataloguePDF(catalogMap) {
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
      const { data: profiles } = await supabase.from('business_profiles').select('*').limit(1)
      const bName = profiles?.[0]?.business_name || 'BusinessVaani'

      doc.rect(0, 0, doc.page.width, 100).fill('#0f172a')
      doc.fillColor('#ffffff').fontSize(22).font(hasFonts ? fontPath : 'Helvetica-Bold')
      doc.text(bName.toUpperCase(), 40, 35)
      
      doc.fillColor('#818cf8').fontSize(10).font(hasFonts ? fontPath : 'Helvetica')
      doc.text('PRODUCT CATALOGUE', 40, 65)

      const now = new Date()
      doc.fillColor('#94a3b8').fontSize(9)
      doc.text(`Generated: ${now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`, doc.page.width - 200, 40, { align: 'right', width: 160 })

      let currentY = 120
      doc.y = currentY

      // Group by category
      const categories = {}
      catalogMap.forEach(entry => {
        const cat = entry.category || 'General'
        if (!categories[cat]) categories[cat] = []
        categories[cat].push(entry)
      })

      for (const [cat, items] of Object.entries(categories)) {
        if (doc.y > doc.page.height - 100) {
          doc.addPage()
          doc.y = 40
        }
        
        // Category Header
        doc.rect(40, doc.y, doc.page.width - 80, 28).fill('#1e293b')
        doc.fillColor('#ffffff').fontSize(11).font(hasFonts ? fontPath : 'Helvetica-Bold')
        doc.text(cat.toUpperCase(), 55, doc.y + 8)
        doc.y += 35

        // Column Labels
        doc.fillColor('#64748b').fontSize(9).font(hasFonts ? fontPath : 'Helvetica-Bold')
        doc.text('#', 55, doc.y)
        doc.text('ITEM NAME', 85, doc.y)
        doc.text('BRAND', 260, doc.y)
        doc.text('PRICE', doc.page.width - 160, doc.y, { width: 100, align: 'right' })
        doc.y += 18
        
        doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
        doc.y += 8

        // Reset for items
        doc.fillColor('#1e293b').fontSize(10).font(hasFonts ? fontPath : 'Helvetica')

        items.forEach((entry, i) => {
          if (doc.y > doc.page.height - 40) {
            doc.addPage()
            doc.y = 40
          }
          
          const price = Number(entry.item.price) || 0
          const brand = entry.item.brand || entry.item.custom_data?.brand || '-'
          const rowY = doc.y

          // Zebra striping
          if (i % 2 === 0) {
            doc.rect(40, rowY - 4, doc.page.width - 80, 24).fill('#f8fafc')
            doc.fillColor('#1e293b') // Reset to dark text!
          }

          doc.text(String(entry.idx), 55, rowY)
          doc.text(entry.item.name, 85, rowY, { width: 170 })
          doc.text(brand, 260, rowY, { width: 120 })
          doc.text(`₹${price} / ${entry.item.unit || 'pcs'}`, doc.page.width - 160, rowY, { width: 100, align: 'right' })
          
          doc.y = rowY + 24
        })

        doc.y += 20
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
