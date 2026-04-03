import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import { extractOrder } from '@/lib/nlu'
import { transcribeVoiceNote } from '@/lib/transcribe'

const OWNER_PHONE = process.env.BUSINESS_OWNER_PHONE || null

// ───── Inventory Helpers ─────

async function loadInventory() {
  const { data } = await supabase.from('inventory').select('*')
  return data || []
}

async function saveInventory(items) {
  // Update Supabase
  const { error } = await supabase.from('inventory').upsert(items, { onConflict: 'id' })
  if (error) console.error('Save inventory error:', error)

  // Also update inventory.json for dashboard
  try {
    const fs = await import('fs').then(m => m.promises)
    const path = await import('path').then(m => m.default)
    const invPath = path.join(process.cwd(), 'data', 'inventory.json')

    const current = JSON.parse(await fs.readFile(invPath, 'utf8'))
    const updated = current.map(inv => {
      const updatedItem = items.find(item => item.id === inv.id)
      return updatedItem || inv
    })

    await fs.writeFile(invPath, JSON.stringify(updated, null, 2))
  } catch (e) {
    console.warn('Could not update inventory.json:', e.message)
  }
}

async function lookupInventoryPrices(items) {
  const inventory = await loadInventory()
  return items.map(item => {
    const itemNameLower = (item.name || '').toLowerCase().trim()
    let match = inventory.find(inv => (inv.name || '').toLowerCase().trim() === itemNameLower)

    if (!match) {
      match = inventory.find(inv => {
        const invName = (inv.name || '').toLowerCase().trim()
        return invName.includes(itemNameLower) || itemNameLower.includes(invName)
      })
    }

    if (!match) {
      const words = itemNameLower.split(/\s+/)
      match = inventory.find(inv => {
        const invName = (inv.name || '').toLowerCase().trim()
        return words.some(w => w.length > 2 && invName.includes(w))
      })
    }

    if (match) {
      return {
        ...item,
        name: match.name,
        price: Number(match.price) || 0,
        unit: match.unit || item.unit || 'pcs',
        inventoryId: match.id,
      }
    }
    return item
  })
}

async function deductAndCheckStock(items) {
  const inventory = await loadInventory()
  const lowStockAlerts = []
  const itemsToUpdate = []

  // Ensure items is an array
  const orderItems = Array.isArray(items) ? items : []

  orderItems.forEach(item => {
    if (!item.inventoryId) return
    const idx = inventory.findIndex(inv => inv.id === item.inventoryId)
    if (idx === -1) return

    const qty = Number(item.quantity) || 1
    const currentQty = Number(inventory[idx].quantity) || 0
    inventory[idx].quantity = Math.max(0, currentQty - qty)
    itemsToUpdate.push(inventory[idx])

    const threshold = Number(inventory[idx].lowStockThreshold) || 10
    if (inventory[idx].quantity <= threshold) {
      lowStockAlerts.push({
        name: inventory[idx].name,
        remaining: inventory[idx].quantity,
        unit: inventory[idx].unit || 'pcs',
        threshold,
      })
    }
  })

  if (itemsToUpdate.length > 0) {
    await saveInventory(itemsToUpdate)
  }
  return lowStockAlerts
}

// ───── Catalog Builder ─────

async function buildCatalog(language) {
  const inventory = await loadInventory()
  const seen = new Set()
  const available = inventory.filter(i => {
    if ((Number(i.quantity) || 0) <= 0) return false
    const key = (i.name || '').toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (available.length === 0) {
    return { message: '😕 Abhi koi item available nahi hai.', catalogMap: [] }
  }

  const header = {
    hindi: '📦 *Hamare Products:*\n_Order ke liye number bhejein (jaise: 1, 3, 5)_\n',
    tamil: '📦 *எங்கள் பொருட்கள்:*\n_ஆர்டர் செய்ய எண்களை அனுப்புங்கள் (எ.கா: 1, 3, 5)_\n',
    telugu: '📦 *మా ఉత్పత్తులు:*\n_ఆర్డర్ చేయడానికి నంబర్లు పంపండి (ఉదా: 1, 3, 5)_\n',
    english: '📦 *Our Products:*\n_Reply with item numbers to order (e.g: 1, 3, 5)_\n',
    hinglish: '📦 *Hamare Products:*\n_Order ke liye number bhejein (jaise: 1, 3, 5)_\n',
  }

  let msg = header[language] || header.hinglish
  const categories = {}

  available.forEach((item) => {
    const cat = item.category || 'General'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(item)
  })

  let idx = 1
  const catalogMap = []

  for (const [cat, items] of Object.entries(categories)) {
    msg += `\n📁 *${cat}*\n`
    items.forEach(item => {
      const price = Number(item.price) || 0
      const stock = Number(item.quantity) || 0
      const threshold = Number(item.lowStockThreshold) || 10
      const stockLabel = stock <= threshold ? ' ⚠️' : ''
      msg += `  ${idx}⃣  ${item.name} — *₹${price}*/${item.unit}${stockLabel}\n`
      catalogMap.push({ idx, item })
      idx++
    })
  }

  msg += `\n──────────────\n`
  msg += `💬 *Order Kaise Karein?*\n`
  msg += `🔢 Reply karein sirf numbers: *"1, 3, 5"*\n`
  msg += `📝 Ya likh kar bhejein: *"2 Rice Bag aur 1 Wheat Flour"*\n`
  msg += `🎙️ Ya ek *Voice Note* bhejein!`

  return { message: msg, catalogMap }
}

// ───── Selection → Order ─────

function buildOrderFromSelection(selectedNumbers, catalogMap) {
  const items = []
  for (const num of selectedNumbers) {
    const entry = catalogMap.find(c => c.idx === num)
    if (entry) {
      items.push({
        name: entry.item.name,
        quantity: 1,
        unit: entry.item.unit || 'pcs',
        price: Number(entry.item.price) || 0,
        inventoryId: entry.item.id,
      })
    }
  }
  return items
}

// ───── Main Webhook ─────

export async function POST(req) {
  try {
    const formData = await req.formData()

    const from = formData.get('From')?.replace('whatsapp:', '')
    const body = formData.get('Body') || ''
    const mediaType = formData.get('MediaContentType0')
    const mediaUrl = formData.get('MediaUrl0')

    console.log(`📩 Message from ${from}: ${body}, Media: ${mediaType}`)

    // ═══════════════════════════════
    // VOICE NOTE → Transcribe with Groq Whisper
    // ═══════════════════════════════
    let messageText = body
    if (mediaType?.includes('audio') && mediaUrl) {
      console.log(`🎙️ Voice note detected! Type: ${mediaType}, URL: ${mediaUrl}`)
      try {
        const transcribedText = await transcribeVoiceNote(mediaUrl)
        messageText = transcribedText
        console.log(`✅ Voice transcribed: "${messageText}"`)

        // Acknowledge voice note to user
        await sendWhatsApp(from, `🎙️ _Voice note samjha:_ "${messageText}"\n\n⏳ Processing...`)
      } catch (err) {
        console.error('❌ Voice transcription failed:', err.message, err.stack)
        await sendWhatsApp(from,
          `❌ Voice note samajh nahi aaya. Please text mein bhejein.\n\n` +
          `📝 Type karein: "5 Rice Bag aur 2 Wheat Flour"\n` +
          `📦 Ya "hi" bhejein catalog dekhne ke liye!`
        )
        return new NextResponse('OK', { status: 200 })
      }
    }
    // ═══════════════════════════════
    // PHOTO/IMAGE → Extract orders using Vision AI
    // ═══════════════════════════════
    else if (mediaType?.includes('image') && mediaUrl) {
      console.log(`📸 Photo detected! Type: ${mediaType}, URL: ${mediaUrl}`)
      
      try {
        // Acknowledge the photo
        await sendWhatsApp(from, `📸 _Photo mil gaya! Order samajh raha hoon..._\n\n⏳ Processing...`)
        
        // Pass image to NLU via extractOrder
        const extracted = await extractOrder(messageText, mediaUrl, mediaType)
        
        if (!extracted.items || extracted.items.length === 0) {
          // No items found in image — ask user to type
          await sendWhatsApp(from,
            `📸 Photo mein koi order items nahi dikh rahe 😅\n\n` +
            `Please text mein likhein kya chahiye:\n` +
            `_"5 Rice Bag aur 2 Wheat Flour"_\n\n` +
            `Ya "hi" bhejein catalog dekhne ke liye! 📦`
          )
          return new NextResponse('OK', { status: 200 })
        }
        
        // Items found! Process as a regular order
        console.log(`📸 Extracted ${extracted.items.length} items from photo`)
        
        // Look up prices from inventory
        const itemsWithPrices = await lookupInventoryPrices(extracted.items)
        
        // Calculate total
        const totalAmount = itemsWithPrices.reduce((sum, item) => {
          const qty = Number(item.quantity) || 1
          const price = Number(item.price) || 0
          return sum + (qty * price)
        }, 0)
        
        // If NO prices found at all → tell customer what's available
        if (totalAmount === 0 && itemsWithPrices.every(i => !i.price)) {
          const catalog = await buildCatalog(extracted.language || 'hinglish')
          try {
            await supabase.from('sessions').upsert({
              phone: from, catalog_map: catalog.catalogMap, updated_at: new Date().toISOString(),
            }, { onConflict: 'phone' })
          } catch {}
          await sendWhatsApp(from,
            `📸 Photo se ye items mile:\n` +
            extracted.items.map(i => `  • ${i.quantity || 1}× ${i.name}`).join('\n') +
            `\n\n⚠️ Ye items hamari inventory mein nahi mile.\n\nYe hai hamare available products:\n\n` + catalog.message
          )
          return new NextResponse('OK', { status: 200 })
        }
        
        // Save order
        await supabase.from('customers').upsert({ phone: from }, { onConflict: 'phone' })
        
        const { data: order } = await supabase
          .from('orders')
          .insert({
            customer_phone: from,
            raw_message: `[📸 Photo Order] ${extracted.items.map(i => `${i.quantity || 1}× ${i.name}`).join(', ')}`,
            items: itemsWithPrices,
            language: extracted.language || 'hinglish',
            status: 'pending',
            total_amount: totalAmount,
          })
          .select().single()
        
        console.log(`✅ Photo order: #${order.id} — ₹${totalAmount}`)
        
        // Deduct stock + alert owner
        const stockAlerts = await handleStockAlerts(itemsWithPrices)
        
        // Confirmation with price breakdown
        const confirmMsg = buildConfirmation(
          itemsWithPrices, order.id, order.total_amount, extracted.language || 'hinglish', stockAlerts
        )
        
        // Prepend photo acknowledgment
        await sendWhatsApp(from,
          `📸 *Photo se order samajh aa gaya!*\n\n` + confirmMsg
        )
        
        return new NextResponse('OK', { status: 200 })
        
      } catch (err) {
        console.error('❌ Photo processing failed:', err.message)
        // Fallback — ask user to type
        await sendWhatsApp(from,
          `📸 Photo process nahi ho paya 😅\n\n` +
          `Please text mein likhein kya chahiye:\n` +
          `_"5 Rice Bag aur 2 Wheat Flour"_\n\n` +
          `Ya "hi" bhejein catalog dekhne ke liye! 📦`
        )
        return new NextResponse('OK', { status: 200 })
      }
    }

    // NLU extraction
    const extracted = await extractOrder(messageText)

    // ═══════════════════════════════
    // GREETING — Auto-show catalog!
    // ═══════════════════════════════
    if (extracted.intent === 'GREETING') {
      const lang = extracted.language || 'hinglish'
      const catalog = await buildCatalog(lang)
      
      const { data: profiles } = await supabase.from('business_profiles').select('*').limit(1)
      const bName = (profiles && profiles.length > 0 && profiles[0].business_name) ? profiles[0].business_name : 'Aapke Store'

      // Welcome + catalog together
      const welcomeMsg = lang === 'english'
        ? `🙏 Hello! Welcome to *${bName}*\n\nHere\'s what we have:\n`
        : `🙏 Namaste! *${bName}* mein aapka swagat hai!\n\nYe rahi hamari product list:\n`

      if (catalog.catalogMap.length > 0) {
        // Store catalog map for selection
        try {
          await supabase.from('sessions').upsert({
            phone: from,
            catalog_map: catalog.catalogMap,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'phone' })
        } catch (e) {
          console.log('Session store skipped (table may not exist):', e.message)
        }

        await sendWhatsApp(from, welcomeMsg + catalog.message)
      } else {
        await sendWhatsApp(from, welcomeMsg + catalog.message)
      }
      return new NextResponse('OK', { status: 200 })
    }

    // ═══════════════════════════════
    // HELP — Show available commands
    // ═══════════════════════════════
    if (extracted.intent === 'HELP') {
      const lang = extracted.language || 'hinglish'
      const { data: profiles } = await supabase.from('business_profiles').select('*').limit(1)
      const bName = (profiles && profiles.length > 0 && profiles[0].business_name) ? profiles[0].business_name : 'Aapka Store'

      const helpMsg = lang === 'english'
        ? `📖 *${bName} Help Guide*\n\n` +
          `Here's what you can do:\n\n` +
          `📦 *"hi"* or *"catalog"* — View product list\n` +
          `🛒 *"5 Rice Bag"* — Place an order directly\n` +
          `🔢 *"1, 3, 5"* — Select items from catalog\n` +
          `📋 *"track"* — Track your latest order\n` +
          `✅ *"confirm"* — Confirm pending order\n` +
          `❌ *"cancel"* — Cancel pending order\n` +
          `💰 *"hisab"* — Check payment status\n` +
          `🎙️ *Voice Note* — Send voice order!\n` +
          `❓ *"help"* — Show this guide\n\n` +
          `_Supported: Hindi, Tamil, Telugu, Marathi, English_ 🌐`
        : `📖 *${bName} Help Guide*\n\n` +
          `Aap ye sab kar sakte hain:\n\n` +
          `📦 *"hi"* ya *"catalog"* — Product list dekhein\n` +
          `🛒 *"5 Rice Bag"* — Direct order karein\n` +
          `🔢 *"1, 3, 5"* — Catalog se select karein\n` +
          `📋 *"track"* — Order ka status dekhein\n` +
          `✅ *"confirm"* — Pending order confirm karein\n` +
          `❌ *"cancel"* — Order cancel karein\n` +
          `💰 *"hisab"* — Payment status check karein\n` +
          `🎙️ *Voice Note* — Voice se order bhejein!\n` +
          `❓ *"help"* — Ye guide dikhao\n\n` +
          `_Supported: Hindi, Tamil, Telugu, Marathi, English_ 🌐`

      await sendWhatsApp(from, helpMsg)
      return new NextResponse('OK', { status: 200 })
    }

    // ═══════════════════════════════
    // TRACK — Track order status
    // ═══════════════════════════════
    if (extracted.intent === 'TRACK') {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', from)
        .order('created_at', { ascending: false })
        .limit(3)

      if (!orders || orders.length === 0) {
        await sendWhatsApp(from,
          `ℹ️ Koi order nahi mila.\n📦 "hi" bhejein products dekhne ke liye!`
        )
      } else {
        const statusEmojis = {
          pending: '⏳ Pending',
          confirmed: '✅ Confirmed',
          preparing: '👨‍🍳 Preparing',
          ready: '📦 Ready',
          shipped: '🚚 Shipped',
          delivered: '✅ Delivered',
          paid: '💰 Paid',
          invoiced: '📄 Invoiced',
          cancelled: '❌ Cancelled',
        }

        let msg = `📋 *Your Recent Orders:*\n\n`
        orders.forEach(o => {
          const items = Array.isArray(o.items) ? o.items : []
          const itemNames = items.map(i => `${i.quantity || 1}× ${i.name}`).join(', ')
          const amt = Number(o.total_amount || 0)
          const grand = +(amt * 1.18).toFixed(2)
          const st = statusEmojis[o.status] || `📌 ${o.status}`
          const date = new Date(o.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

          msg += `🔖 *Order #${String(o.id).padStart(4, '0')}*\n`
          msg += `   📅 ${date}\n`
          msg += `   📦 ${itemNames || 'N/A'}\n`
          msg += `   💰 ₹${grand}\n`
          msg += `   📌 ${st}\n\n`
        })

        msg += `_"confirm" ya "cancel" bhejein pending order ke liye_`
        await sendWhatsApp(from, msg)
      }
      return new NextResponse('OK', { status: 200 })
    }

    // ═══════════════════════════════
    // CONFIRM — Confirm pending order
    // ═══════════════════════════════
    if (extracted.intent === 'CONFIRM') {
      const { data: pendingOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', from)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!pendingOrder) {
        await sendWhatsApp(from,
          `ℹ️ Koi pending order nahi mila.\n📦 "hi" bhejein naya order dene ke liye!`
        )
      } else {
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', pendingOrder.id)

        const items = Array.isArray(pendingOrder.items) ? pendingOrder.items : []
        const itemNames = items.map(i => `${i.quantity || 1}× ${i.name}`).join(', ')
        const amt = Number(pendingOrder.total_amount || 0)
        const grand = +(amt * 1.18).toFixed(2)

        await sendWhatsApp(from,
          `✅ *Order #${String(pendingOrder.id).padStart(4, '0')} Confirmed!*\n\n` +
          `📦 ${itemNames}\n` +
          `💰 Total: ₹${grand}\n\n` +
          `⏳ Generating your PDF invoice and payment link...`
        )

        // Notify owner
        if (OWNER_PHONE) {
          sendWhatsApp(OWNER_PHONE,
            `🔔 *Order Confirmed!*\n` +
            `📱 ${from}\n` +
            `📦 ${itemNames}\n` +
            `💰 ₹${grand}\n` +
            `#${String(pendingOrder.id).padStart(4, '0')}`
          ).catch(e => console.error('Owner notify failed:', e))
        }

        // Auto-generate invoice
        try {
          const invoiceUrl = new URL('/api/invoice', req.url)
          // We MUST await this so Vercel serverless function doesn't terminate early
          await fetch(invoiceUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: pendingOrder.id, phone: from }),
          })
        } catch (err) {
          console.error('Auto-invoice error:', err)
        }
      }
      return new NextResponse('OK', { status: 200 })
    }

    // ═══════════════════════════════
    // CANCEL — Cancel pending order
    // ═══════════════════════════════
    if (extracted.intent === 'CANCEL') {
      const { data: pendingOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', from)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!pendingOrder) {
        await sendWhatsApp(from,
          `ℹ️ Koi pending order nahi mila cancel karne ke liye.\n📦 "hi" bhejein products dekhne ke liye!`
        )
      } else {
        // Restore stock
        if (Array.isArray(pendingOrder.items)) {
          const inventory = await loadInventory()
          const itemsToUpdate = []

          pendingOrder.items.forEach(item => {
            if (!item.inventoryId) return
            const idx = inventory.findIndex(inv => inv.id === item.inventoryId)
            if (idx !== -1) {
              const currentQty = Number(inventory[idx].quantity) || 0
              inventory[idx].quantity = currentQty + (Number(item.quantity) || 1)
              itemsToUpdate.push(inventory[idx])
            }
          })

          if (itemsToUpdate.length > 0) {
            await saveInventory(itemsToUpdate)
          }
        }

        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', pendingOrder.id)

        await sendWhatsApp(from,
          `❌ *Order #${String(pendingOrder.id).padStart(4, '0')} Cancel ho gaya!*\n\n` +
          `📦 Stock restore kar diya gaya hai.\n` +
          `🛒 "hi" bhejein naya order dene ke liye!`
        )
      }
      return new NextResponse('OK', { status: 200 })
    }

    // ═══════════════════════════════
    // CATALOG / INQUIRY — Send product list
    // ═══════════════════════════════
    if (extracted.intent === 'CATALOG' || extracted.intent === 'INQUIRY') {
      const lang = extracted.language || 'hinglish'
      const catalog = await buildCatalog(lang)

      try {
        await supabase.from('sessions').upsert({
          phone: from,
          catalog_map: catalog.catalogMap,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'phone' })
      } catch (e) {
        console.log('Session store skipped:', e.message)
      }

      await sendWhatsApp(from, catalog.message)
      return new NextResponse('OK', { status: 200 })
    }

    // ═══════════════════════════════
    // SELECTION — User picked from catalog (e.g. "1, 3, 5")
    // ═══════════════════════════════
    if (extracted.intent === 'SELECTION' && extracted.selectedNumbers) {
      // Get stored catalog map
      let catalogMap = null
      try {
        const { data: session } = await supabase
          .from('sessions')
          .select('catalog_map')
          .eq('phone', from)
          .single()
        catalogMap = session?.catalog_map
      } catch (e) {
        console.log('Session lookup skipped:', e.message)
      }

      if (!catalogMap) {
        // No session? Send catalog first
        const catalog = await buildCatalog(extracted.language || 'hinglish')
        try {
          await supabase.from('sessions').upsert({
            phone: from,
            catalog_map: catalog.catalogMap,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'phone' })
        } catch { }
        await sendWhatsApp(from,
          `❌ Pehle catalog dekhein, phir number se select karein:\n\n` + catalog.message
        )
        return new NextResponse('OK', { status: 200 })
      }

      const selectedItems = buildOrderFromSelection(extracted.selectedNumbers, catalogMap)

      if (selectedItems.length === 0) {
        await sendWhatsApp(from,
          `❌ Invalid selection. Sahi numbers bhejein catalog se.`)
        return new NextResponse('OK', { status: 200 })
      }

      // Calculate & save order
      const totalAmount = selectedItems.reduce((sum, i) =>
        sum + (Number(i.quantity) || 1) * (Number(i.price) || 0), 0
      )

      await supabase.from('customers').upsert({ phone: from }, { onConflict: 'phone' })

      const { data: order } = await supabase
        .from('orders')
        .insert({
          customer_phone: from,
          raw_message: messageText,
          items: selectedItems,
          language: extracted.language,
          status: 'pending',
          total_amount: totalAmount,
        })
        .select().single()

      console.log(`✅ Selection order: #${order.id} — ₹${totalAmount}`)

      // Deduct stock + get low stock alerts
      const stockAlerts = await handleStockAlerts(selectedItems)

      // Send confirmation with price breakdown + stock alerts
      const confirmMsg = buildConfirmation(selectedItems, order.id, totalAmount, extracted.language, stockAlerts)
      await sendWhatsApp(from, confirmMsg)

      // Clear session
      try { await supabase.from('sessions').delete().eq('phone', from) } catch { }

      return new NextResponse('OK', { status: 200 })
    }

    // ═══════════════════════════════
    // PAYMENT_STATUS — "hisab batao"
    // ═══════════════════════════════
    if (extracted.intent === 'PAYMENT_STATUS') {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', from)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!orders || orders.length === 0) {
        await sendWhatsApp(from, `ℹ️ Aapka koi order nahi mila.\n📦 "hi" bhejein products dekhne ke liye!`)
      } else {
        let msg = `📋 *Aapke Recent Orders:*\n\n`
        let totalDue = 0
        orders.forEach(o => {
          const amt = Number(o.total_amount || 0)
          const grand = +(amt * 1.18).toFixed(2)
          const st = o.status === 'paid' ? '✅ Paid' : o.status === 'invoiced' ? '📄 Invoiced' : o.status === 'cancelled' ? '❌ Cancelled' : '⏳ Pending'
          msg += `#${String(o.id).padStart(4, '0')} — ₹${grand} — ${st}\n`
          if (o.status !== 'paid' && o.status !== 'cancelled') totalDue += grand
        })
        if (totalDue > 0) {
          msg += `\n💰 *Total Pending:* ₹${totalDue.toFixed(2)}`
        } else {
          msg += `\n✅ *Sab paid hai!* Thank you 🙏`
        }
        await sendWhatsApp(from, msg)
      }
      return new NextResponse('OK', { status: 200 })
    }

    // ═══════════════════════════════
    // ORDER — Direct order ("5 Rice Bag bhejdo")
    // ═══════════════════════════════
    if (extracted.intent === 'ORDER' && extracted.items?.length > 0) {
      // Look up prices from inventory
      const itemsWithPrices = await lookupInventoryPrices(extracted.items)

      // Calculate total
      const totalAmount = itemsWithPrices.reduce((sum, item) => {
        const qty = Number(item.quantity) || 1
        const price = Number(item.price) || 0
        return sum + (qty * price)
      }, 0)

      console.log(`💰 Order items:`, itemsWithPrices.map(i => `${i.name}: ₹${i.price} x ${i.quantity}`))

      // If NO prices found at all → tell customer what's available
      if (totalAmount === 0 && itemsWithPrices.every(i => !i.price)) {
        const catalog = await buildCatalog(extracted.language || 'hinglish')
        try {
          await supabase.from('sessions').upsert({
            phone: from, catalog_map: catalog.catalogMap, updated_at: new Date().toISOString(),
          }, { onConflict: 'phone' })
        } catch { }
        await sendWhatsApp(from,
          `⚠️ Ye items hamari inventory mein nahi mile.\n\nYe hai hamare available products:\n\n` + catalog.message
        )
        return new NextResponse('OK', { status: 200 })
      }

      await supabase.from('customers').upsert({ phone: from }, { onConflict: 'phone' })

      const { data: order } = await supabase
        .from('orders')
        .insert({
          customer_phone: from,
          raw_message: messageText,
          items: itemsWithPrices,
          language: extracted.language,
          status: 'pending',
          total_amount: totalAmount || extracted.estimatedTotal || 0,
        })
        .select().single()

      console.log(`✅ Direct order: #${order.id} — ₹${order.total_amount}`)

      // Deduct stock + alert owner
      const stockAlerts = await handleStockAlerts(itemsWithPrices)

      // Confirmation with price breakdown
      const confirmMsg = buildConfirmation(
        itemsWithPrices, order.id, order.total_amount, extracted.language, stockAlerts
      )
      await sendWhatsApp(from, confirmMsg)

      return new NextResponse('OK', { status: 200 })
    }

    // ═══════════════════════════════
    // INVOICE — Request invoice
    // ═══════════════════════════════
    if (extracted.intent === 'INVOICE') {
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', from)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (lastOrder) {
        try {
          const invoiceUrl = new URL('/api/invoice', req.url)
          await fetch(invoiceUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: lastOrder.id, phone: from }),
          })
        } catch (err) {
          console.error('Auto-invoice error:', err)
          await sendWhatsApp(from, `✅ Invoice generate ho raha hai. Thoda wait karein! 🙏`)
        }
      } else {
        await sendWhatsApp(from, `ℹ️ Koi pending order nahi mila.\n📦 "hi" bhejein products dekhne ke liye!`)
      }
      return new NextResponse('OK', { status: 200 })
    }

    // ═══════════════════════════════
    // OTHER / Unknown — Show help + catalog
    // ═══════════════════════════════
    const catalog = await buildCatalog(extracted.language || 'hinglish')
    try {
      await supabase.from('sessions').upsert({
        phone: from, catalog_map: catalog.catalogMap, updated_at: new Date().toISOString(),
      }, { onConflict: 'phone' })
    } catch { }

    await sendWhatsApp(from,
      `👋 BusinessVaani mein aapka swagat hai!\n\n` +
      `Ye rahi hamari product list:\n\n` +
      catalog.message + `\n\n` +
      `📝 Ya directly likh sakte hain:\n_"5 Rice Bag aur 2 Wheat Flour bhejdo"_\n\n` +
      `💰 "hisab" — Payment status\n` +
      `📋 "track" — Order status\n` +
      `❓ "help" — Sab commands dekhein`
    )
    return new NextResponse('OK', { status: 200 })

  } catch (err) {
    console.error('Webhook error:', err)
    return new NextResponse('Error', { status: 500 })
  }
}

// ───── Stock Alert Helper ─────

async function handleStockAlerts(items) {
  const lowStockAlerts = await deductAndCheckStock(items)

  // Notify OWNER of low stock 🔔
  if (lowStockAlerts.length > 0 && OWNER_PHONE) {
    const alertMsg = `🚨 *Low Stock Alert!*\n\n` +
      lowStockAlerts.map(a =>
        `⚠️ *${a.name}* — Only ${a.remaining} ${a.unit || 'units'} left (threshold: ${a.threshold})`
      ).join('\n') +
      `\n\n_Restock karein! 📦_`
    sendWhatsApp(OWNER_PHONE, alertMsg).catch(e => console.error('Stock alert failed:', e))
  }

  return lowStockAlerts // Return for customer notification
}

// ───── Confirmation with Prices + Low Stock Alerts ─────

function buildConfirmation(items, orderId, totalAmount, language, stockAlerts = []) {
  const itemList = items
    .map(i => {
      const qty = Number(i.quantity) || 1
      const price = Number(i.price) || 0
      const total = qty * price
      if (price > 0) {
        return `  • ${qty}× ${i.name} — ₹${price}/${i.unit || 'pcs'} = *₹${total}*`
      }
      return `  • ${qty}× ${i.name}`
    })
    .join('\n')

  const sub = Number(totalAmount) || 0
  const gst = +(sub * 0.18).toFixed(2)
  const grand = +(sub + gst).toFixed(2)

  // Build low stock alert section
  let stockAlertSection = ''
  if (stockAlerts && stockAlerts.length > 0) {
    stockAlertSection = `\n⚠️ *Current Stock:*\n` +
      stockAlerts.map(a =>
        `${a.name} → ${a.remaining} ${a.unit || 'units'} left`
      ).join('\n') +
      `\n_Restock recommended!_\n`
  }

  const templates = {
    tamil: `✅ *Order பதிவு! (#${orderId})*\n\n${itemList}\n\n💵 Subtotal: ₹${sub}\n🧾 GST (18%): ₹${gst}\n💰 *Total: ₹${grand}*${stockAlertSection}\n✅ "confirm" — Order confirm karein\n❌ "cancel" — Cancel karein`,
    marathi: `✅ *ऑर्डर नोंदवला! (#${orderId})*\n\n${itemList}\n\n💵 Subtotal: ₹${sub}\n🧾 GST (18%): ₹${gst}\n💰 *Total: ₹${grand}*${stockAlertSection}\n✅ "confirm" — Order confirm करा\n❌ "cancel" — Cancel करा`,
    telugu: `✅ *ఆర్డర్ నమోదు! (#${orderId})*\n\n${itemList}\n\n💵 Subtotal: ₹${sub}\n🧾 GST (18%): ₹${gst}\n💰 *Total: ₹${grand}*${stockAlertSection}\n✅ "confirm" — Confirm చేయండి\n❌ "cancel" — Cancel చేయండి`,
    english: `✅ *Order #${orderId} Placed!*\n\n${itemList}\n\n💵 Subtotal: ₹${sub}\n🧾 GST (18%): ₹${gst}\n💰 *Total: ₹${grand}*${stockAlertSection}\n✅ Reply "confirm" to confirm\n❌ Reply "cancel" to cancel`,
    hindi: `✅ *Order #${orderId} Placed!*\n\n${itemList}\n\n💵 Subtotal: ₹${sub}\n🧾 GST (18%): ₹${gst}\n💰 *Total: ₹${grand}*${stockAlertSection}\n✅ "confirm" — Confirm karein\n❌ "cancel" — Cancel karein`,
    hinglish: `✅ *Order #${orderId} Placed!*\n\n${itemList}\n\n💵 Subtotal: ₹${sub}\n🧾 GST (18%): ₹${gst}\n💰 *Total: ₹${grand}*${stockAlertSection}\n✅ "confirm" — Confirm karein\n❌ "cancel" — Cancel karein`,
  }

  return templates[language] || templates.hinglish
}