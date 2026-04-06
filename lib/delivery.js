// lib/delivery.js
// NEW CODE — Delivery Management Service

import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import { getNextDeliveryAgent, getAgentByPhone } from '@/lib/delivery-config'

/**
 * Assign a delivery agent to an order (called after order is confirmed).
 * - Picks next agent via round-robin
 * - Updates order in Supabase with agent name + delivery_status
 * - Sends WhatsApp message to the delivery agent with order details
 */
export async function assignDeliveryAgent(orderId) {
  try {
    // Fetch the order first to get the profile_id (owner's ID)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, customer_phone, address, total_amount')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('❌ Could not fetch order for delivery assignment:', orderError)
      return null
    }

    // Assign based on the business owner's profile (profile_id)
    const { data: profiles } = await supabase
      .from('business_profiles')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1);

    const profileId = profiles?.[0]?.id

    // Fallback: If no profile ID found, assign ANY available delivery agent.
    let agent = null
    if (profileId) {
      agent = await getNextDeliveryAgent(profileId)
    }

    if (!agent) {
      // Find ANY active agent globally
      const { data: allAgents } = await supabase
        .from('delivery_agents')
        .select('*')
        .eq('is_active', true)
        
      if (allAgents && allAgents.length > 0) {
        agent = allAgents[Math.floor(Math.random() * allAgents.length)]
      }
    }

    if (!agent) {
      console.log('⚠️ No delivery agents configured anywhere. Skipping assignment.')
      return null
    }

    // Update order with delivery info
    await supabase
      .from('orders')
      .update({
        status: 'assigned',
        delivery_agent: agent.name,
        delivery_status: 'CONFIRMED',
      })
      .eq('id', orderId)

    // Build item list for the agent message
    const items = Array.isArray(order.items) ? order.items : []
    const itemList = items.map(i => `  • ${i.quantity || 1}× ${i.name}`).join('\n')
    const amt = Number(order.total_amount || 0)
    const grand = +(amt * 1.18).toFixed(2)

    // Send WhatsApp to delivery agent
    const agentMsg = [
      `📦 *New Delivery Assignment!*`,
      ``,
      `🔖 *Order #${String(orderId).padStart(4, '0')}*`,
      `📱 Customer: ${order.customer_phone}`,
      `📍 Address: ${order.address || 'Not provided yet'}`,
      ``,
      `📋 *Items:*`,
      itemList || '  (No items)',
      ``,
      `💰 Total: ₹${grand}`,
      ``,
      `──────────────`,
      `Reply with:`,
      `✅ *PICKED ${orderId}* — when you pick up the order`,
      `✅ *DELIVERED ${orderId}* — when delivered to customer`,
    ].join('\n')

    await sendWhatsApp(agent.phone, agentMsg)
    console.log(`🚚 Delivery assigned: Order #${orderId} → ${agent.name} (${agent.phone})`)

    return agent
  } catch (err) {
    console.error('❌ Delivery assignment failed:', err)
    return null
  }
}

/**
 * Handle incoming messages from delivery agents.
 * Parses: "PICKED <order_id>" or "DELIVERED <order_id>"
 * Updates delivery_status in Supabase and notifies the customer.
 * 
 * Returns true if the message was handled, false otherwise.
 */
export async function handleDeliveryAgentMessage(from, body) {
  const cleanBody = (body || '').trim().toUpperCase()

  // Match PICKED <id> or DELIVERED <id>
  const pickedMatch = cleanBody.match(/^PICKED\s+(\d+)$/i)
  const deliveredMatch = cleanBody.match(/^DELIVERED\s+(\d+)$/i)

  if (!pickedMatch && !deliveredMatch) {
    // Not a recognized delivery command — send help
    await sendWhatsApp(from, [
      `📦 *Delivery Agent Commands:*`,
      ``,
      `Reply with:`,
      `✅ *PICKED <order_id>* — when you pick up the order`,
      `✅ *DELIVERED <order_id>* — when delivered to customer`,
      ``,
      `Example: PICKED 42`,
    ].join('\n'))
    return true // Still handled (don't pass to customer flow)
  }

  const isPickup = !!pickedMatch
  const orderId = parseInt(isPickup ? pickedMatch[1] : deliveredMatch[1])
  const newStatus = isPickup ? 'PICKED' : 'DELIVERED'

  // Fetch the order
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    await sendWhatsApp(from, `❌ Order #${orderId} not found. Please check the order ID.`)
    return true
  }

  // Verify this agent exists in the database
  const agent = await getAgentByPhone(from)
  if (agent && order.delivery_agent && order.delivery_agent !== agent.name) {
    await sendWhatsApp(from, `❌ Order #${orderId} is not assigned to you.`)
    return true
  }

  if (!agent) {
    console.error(`❌ Unrecognized delivery agent phone: ${from}`)
    return false
  }

  // Update delivery status and main order status
  await supabase
    .from('orders')
    .update({ 
      delivery_status: newStatus,
      status: newStatus === 'PICKED' ? 'shipped' : 'delivered'
    })
    .eq('id', orderId)

  console.log(`🚚 Delivery update: Order #${orderId} → ${newStatus} by ${agent?.name || from}`)

  // Notify the delivery agent (confirmation)
  const agentConfirmMsg = isPickup
    ? `✅ Order #${String(orderId).padStart(4, '0')} marked as *PICKED UP*!\n\nDeliver to customer and reply:\n*DELIVERED ${orderId}*`
    : `✅ Order #${String(orderId).padStart(4, '0')} marked as *DELIVERED*!\n\nThank you! 🙏`

  await sendWhatsApp(from, agentConfirmMsg)

  // Notify the customer
  if (order.customer_phone) {
    if (isPickup) {
      await sendWhatsApp(order.customer_phone, [
        `🚚 *Order Update!*`,
        ``,
        `Your order #${String(orderId).padStart(4, '0')} has been *picked up* by our delivery partner!`,
        ``,
        `📦 It's on its way to you.`,
        `📍 Estimated delivery: Soon`,
        ``,
        `_Reply \"track ${orderId}\" to check delivery status_`,
      ].join('\n'))
    } else {
      await sendWhatsApp(order.customer_phone, [
        `✅ *Order Delivered!*`,
        ``,
        `Your order #${String(orderId).padStart(4, '0')} has been *delivered*! 🎉`,
        ``,
        `Thank you for shopping with us! 🙏`,
        ``,
        `_Send \"hi\" to place a new order!_`,
      ].join('\n'))
    }
  }

  return true
}

/**
 * Get delivery status for an order (used by customer tracking).
 * Returns a formatted string with delivery info.
 */
export async function getDeliveryStatus(orderId) {
  const { data: order } = await supabase
    .from('orders')
    .select('delivery_status, delivery_agent, address')
    .eq('id', orderId)
    .single()

  if (!order) return null

  return {
    status: order.delivery_status || 'CONFIRMED',
    agent: order.delivery_agent || 'Not assigned',
    address: order.address || 'Not provided',
  }
}
