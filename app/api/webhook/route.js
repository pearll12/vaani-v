import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import { extractOrder } from '@/lib/nlu'
import { transcribeVoiceNote } from '@/lib/transcribe'
// EXTENSION — Delivery management imports
import { isDeliveryAgent } from '@/lib/delivery-config'
import { assignDeliveryAgent, handleDeliveryAgentMessage, getDeliveryStatus } from '@/lib/delivery'
import { generateAndUploadCataloguePDF } from '@/lib/pdfCatalogue'
import { getAddressFromCoords } from '@/lib/geocoding'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

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

async function deductAndCheckStock(items, shouldDeduct = true) {
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
    const newQty = Math.max(0, currentQty - qty)
    
    if (shouldDeduct) {
      inventory[idx].quantity = newQty
      itemsToUpdate.push(inventory[idx])
    }

    const threshold = Number(inventory[idx].lowStockThreshold) || 10
    if (newQty <= threshold) {
      lowStockAlerts.push({
        name: inventory[idx].name,
        remaining: newQty,
        unit: inventory[idx].unit || 'pcs',
        threshold,
      })
    }
  })

  if (shouldDeduct && itemsToUpdate.length > 0) {
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
    hindi: '📦 *Hamare Products:*\n',
    tamil: '📦 *எங்கள் பொருட்கள்:*\n',
    telugu: '📦 *మా ఉత్పత్తులు:*\n',
    english: '📦 *Our Products:*\n',
    hinglish: '📦 *Hamare Products:*\n',
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
      msg += `  • ${item.name} — *₹${price}*/${item.unit}${stockLabel}\n`
      catalogMap.push({ idx, item, category: cat })
      idx++
    })
  }

  msg += `\n──────────────\n`
  msg += `💬 *Order Kaise Karein?*\n`
  msg += `📝 Likh kar bhejein: *"2 Rice Bag aur 1 Wheat Flour"*\n`
  msg += `🎙️ Ya ek *Voice Note* bhejein!\n\n`
  msg += `❓ Sabhi commands ke liye *"help"* likhein`

  let pdfUrl = null
  try {
    pdfUrl = await generateAndUploadCataloguePDF(catalogMap)
  } catch (err) {
    console.error('PDF Generation Skipped:', err)
  }

  return { message: msg, catalogMap, pdfUrl }
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

import { generateAndSendInvoice } from '@/lib/invoice'

export async function POST(req) {
  try {
    const formData = await req.formData()

    const from = formData.get('From')?.replace('whatsapp:', '')
    const body = formData.get('Body') || ''
    const mediaType = formData.get('MediaContentType0')
    const mediaUrl = formData.get('MediaUrl0')
    const latitude = formData.get('Latitude')
    const longitude = formData.get('Longitude')

    console.log(`📩 Message from ${from}: ${body}, Media: ${mediaType}, Lat: ${latitude}, Lng: ${longitude}`)

    // Fetch business profile configuration
    const { data: profiles } = await supabase.from('business_profiles').select('*').order('updated_at', { ascending: false }).limit(1);

    const profile = profiles?.[0]
    // Default to true for testing/missing profile so address is always asked
    const hasDelivery = (profile && profile.has_delivery_partner === false) ? false : true

    // ═══════════════════════════════
    // EXTENSION — Delivery Agent Message Routing
    // If sender is a delivery agent, handle separately and return
    // ═══════════════════════════════
    if (hasDelivery && (await isDeliveryAgent(from))) {
      console.log(`🚚 Message from delivery agent: ${from}`)
      await handleDeliveryAgentMessage(from, body)
      return new NextResponse('OK', { status: 200 })
    }

    // ═══════════════════════════════
    // EXTENSION — Address capture (customer replies with address after confirmation)
    // ═══════════════════════════════
    if (hasDelivery) {
      const { data: awaitingOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', from)
        .eq('delivery_status', 'AWAITING_ADDRESS')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (awaitingOrder) {
        let finalAddress = (body || '').trim()
        
        // Handle Map/Location Pin
        if (latitude && longitude) {
          console.log(`📍 Location pin received for Order #${awaitingOrder.id}: ${latitude}, ${longitude}`)
          const geoAddress = await getAddressFromCoords(latitude, longitude)
          if (geoAddress) {
            finalAddress = geoAddress
          } else {
            finalAddress = `Location Pin: ${latitude}, ${longitude}`
          }
        }

        if (finalAddress && finalAddress.length > 3) {
          // Save the address
          await supabase
            .from('orders')
            .update({ address: finalAddress, delivery_status: 'CONFIRMED' })
            .eq('id', awaitingOrder.id)

          console.log(`📍 Address saved for Order #${awaitingOrder.id}: ${finalAddress}`)

          // STEP 1: Auto-assign delivery partner
          let assignedAgent = null
          try {
            console.log(`🚚 Auto-assigning delivery partner for Order #${awaitingOrder.id}...`)
            assignedAgent = await assignDeliveryAgent(awaitingOrder.id)
            if (assignedAgent) {
              console.log(`✅ Delivery partner assigned: ${assignedAgent.name} (${assignedAgent.phone})`)
            } else {
              console.log(`⚠️ No delivery partner available for assignment`)
            }
          } catch (err) {
            console.error('❌ Delivery assignment error:', err)
          }

          // STEP 2: Notify customer (address saved + partner assigned + invoice coming)
          await sendWhatsApp(from, [
            `📍 *Address saved!*`,
            ``,
            `🔖 Order #${String(awaitingOrder.id).padStart(4, '0')}`,
            `📍 ${finalAddress}`,
            ...(assignedAgent ? [
              ``,
              `🚚 *Delivery Partner:* ${assignedAgent.name}`,
              `📱 Contact: ${assignedAgent.phone}`,
            ] : []),
            ``,
            `⏳ Generating your invoice and payment link...`,
          ].join('\n'))

          // STEP 3: Generate & send invoice + Razorpay link
          try {
            console.log(`📡 Triggering invoice for order #${awaitingOrder.id}...`)
            const result = await generateAndSendInvoice(awaitingOrder.id, from)
            
            if (result && result.success) {
              console.log(`✅ Invoice successfully generated and sent for order #${awaitingOrder.id}`)
            } else {
              console.error(`❌ Invoice generation failed:`, result?.error)
            }
          } catch (err) {
            console.error('❌ Invoice generation error:', err)
          }

          return new NextResponse('OK', { status: 200 })
        }
      }
    }

    // ═══════════════════════════════
    // EXTENSION — "track <order_id>" command from customer
    // ═══════════════════════════════
    const trackWithIdMatch = (body || '').trim().match(/^track\s+(\d+)$/i)
    if (trackWithIdMatch) {
      const trackOrderId = parseInt(trackWithIdMatch[1])
      const deliveryInfo = await getDeliveryStatus(trackOrderId)

      if (!deliveryInfo) {
        await sendWhatsApp(from, `❌ Order #${trackOrderId} not found.`)
      } else {
        const statusEmojis = {
          CONFIRMED: '✅ Confirmed — Preparing for dispatch',
          PICKED: '🚚 Picked Up — On the way!',
          DELIVERED: '📦 Delivered! ✅',
        }
        const statusText = statusEmojis[deliveryInfo.status] || `📌 ${deliveryInfo.status}`

        await sendWhatsApp(from, [
          `📋 *Order #${String(trackOrderId).padStart(4, '0')} — Delivery Status*`,
          ``,
          `📌 Status: ${statusText}`,
          `🚚 Delivery Partner: ${deliveryInfo.agent}`,
          `📍 Address: ${deliveryInfo.address}`,
          ``,
          `_Send "track ${trackOrderId}" anytime for updates_`,
        ].join('\n'))
      }
      return new NextResponse('OK', { status: 200 })
    }
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
    // PHOTO/IMAGE → (Disabled for now as per project scope)
    // ═══════════════════════════════
    else if (mediaType?.includes('image') && mediaUrl) {
      await sendWhatsApp(from,
        `📸 Abhi hum photo se order nahi lete. 🙏\n\n` +
        `Please text mein likhein ya *Voice Note* bhejein:\n` +
        `_"5 Rice Bag aur 2 Wheat Flour"_\n\n` +
        `Ya "hi" bhejein catalog dekhne ke liye! 📦`
      )
      return new NextResponse('OK', { status: 200 })
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
        ? `🙏 Hello! Welcome to *${bName}*\n\nHere's what we have:\n`
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
      }

      await sendWhatsApp(from, welcomeMsg + catalog.message, catalog.pdfUrl || null)
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
        ? `📖 *BusinessVaani Help Guide*\n\n` +
        `Here's what you can do:\n\n` +
        `📦 *"hi"* or *"catalog"* — View product list\n` +
        `🛒 *"5 Rice Bag"* — Place an order directly\n` +
        `📋 *"track"* — Track your latest order\n` +
        `✅ *"confirm"* — Confirm pending order\n` +
        `❌ *"cancel"* — Cancel pending order\n` +
        `💰 *"hisab"* — Check payment status\n` +
        `🎙️ *Voice Note* — Send voice order!\n` +
        `❓ *"help"* — Show this guide\n\n` +
        `_Supported: Hindi, Tamil, Telugu, Marathi, English_ 🌐`
        : `📖 *BusinessVaani Help Guide*\n\n` +
        `Aap ye sab kar sakte hain:\n\n` +
        `📦 *"hi" ya "catalog"* — Product list dekhein\n` +
        `🛒 *"5 Rice Bag"* — Direct order karein\n` +
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
          msg += `   📌 ${st}\n`
          // EXTENSION — Show delivery status if available
          if (o.delivery_status) {
            const deliveryEmoji = { CONFIRMED: '📋', PICKED: '🚚', DELIVERED: '✅' }
            msg += `   ${deliveryEmoji[o.delivery_status] || '📦'} Delivery: ${o.delivery_status}\n`
          }
          if (o.delivery_agent) {
            msg += `   🏍️ Agent: ${o.delivery_agent}\n`
          }
          msg += `\n`
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

        // Exact inventory deduction ONLY on confirm
        await handleStockAlerts(items)
        await sendWhatsApp(from,
          `✅ *Order #${String(pendingOrder.id).padStart(4, '0')} Confirmed!*\n\n` +
          `📦 ${itemNames}\n` +
          `💰 Total: ₹${grand}\n\n` +
          `⏳ Generating your PDF invoice...`
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

        // EXTENSION — Ask for delivery address before assigning agent (ONLY if feature enabled)
        if (hasDelivery) {
          try {
            await supabase
              .from('orders')
              .update({ delivery_status: 'AWAITING_ADDRESS' })
              .eq('id', pendingOrder.id)

            await sendWhatsApp(from, [
              `📍 *Please share your delivery address:*`,
              ``,
              `📎 Click the *+* or *📎* icon and select *Location* to send a pin, or simply type your full address.`,
              ``,
              `_This helps our delivery partner find you quickly!_ 🚚`,
            ].join('\n'))
          } catch (err) {
            console.error('Address request error (non-blocking):', err)
          }
        }
        // Auto-generate invoice (ONLY if NO delivery, otherwise we wait for address)
        if (!hasDelivery) {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin
            const invoiceUrl = new URL('/api/invoice', baseUrl)

            console.log(`🧾 Triggering invoice for Order #${pendingOrder.id} at ${invoiceUrl.toString()}`)

            // We MUST await this so Vercel serverless function doesn't terminate early
            const invRes = await fetch(invoiceUrl.toString(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: pendingOrder.id, phone: from }),
            })

            if (!invRes.ok) {
              const errorText = await invRes.text()
              console.error(`❌ Invoice generation failed (HTTP ${invRes.status}):`, errorText)
            } else {
              console.log(`✅ Invoice generation triggered successfully for Order #${pendingOrder.id}`)
            }
          } catch (err) {
            console.error('❌ Auto-invoice fetch error:', err.message)
          }
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

      await sendWhatsApp(from, catalog.message, catalog.pdfUrl || null)
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
      const stockAlerts = await handleStockAlerts(selectedItems, false)

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
      const stockAlerts = await handleStockAlerts(itemsWithPrices, false)

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
      `❓ "help" — Sab commands dekhein`,
      catalog.pdfUrl || null
    )
    return new NextResponse('OK', { status: 200 })

  } catch (err) {
    console.error('Webhook error:', err)
    return new NextResponse('Error', { status: 500 })
  }
}

// ───── Stock Alert Helper ─────

async function handleStockAlerts(items, shouldDeduct = true) {
  const lowStockAlerts = await deductAndCheckStock(items, shouldDeduct)

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
