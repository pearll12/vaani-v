import { supabase } from '@/lib/supabase'

/**
 * Fetch delivery agents for a specific business profile.
 */
export async function getDeliveryAgents(profileId) {
  const { data, error } = await supabase
    .from('delivery_agents')
    .select('*')
    .eq('profile_id', profileId)
    .eq('is_active', true)
  
  if (error) {
    console.error('Error fetching delivery agents:', error)
    return []
  }
  return data || []
}

// Global round-robin counter (resets on server restart)
let assignmentCounter = 0

/**
 * Get next delivery agent via round-robin assignment from the database.
 */
export async function getNextDeliveryAgent(profileId) {
  const agents = await getDeliveryAgents(profileId)
  if (agents.length === 0) return null
  
  const agent = agents[assignmentCounter % agents.length]
  assignmentCounter++
  return agent
}

/**
 * Check if a phone number belongs to a delivery agent in the database.
 */
export async function isDeliveryAgent(phone) {
  if (!phone) return false
  
  const cleanPhone = phone.replace(/whatsapp:/gi, '').replace(/\s+/g, '').trim()
  
  const { data: agents } = await supabase
    .from('delivery_agents')
    .select('*')
    .eq('is_active', true)
  
  if (!agents) return false

  return agents.some(agent => {
    const cleanAgent = agent.phone.replace(/\s+/g, '').trim()
    return cleanPhone === cleanAgent || cleanPhone.endsWith(cleanAgent.replace('+', ''))
  })
}

/**
 * Get agent details by phone number from the database.
 */
export async function getAgentByPhone(phone) {
  if (!phone) return null
  
  const cleanPhone = phone.replace(/whatsapp:/gi, '').replace(/\s+/g, '').trim()
  
  const { data: agents } = await supabase
    .from('delivery_agents')
    .select('*')
    .eq('is_active', true)
    
  if (!agents) return null

  return agents.find(agent => {
    const cleanAgent = agent.phone.replace(/\s+/g, '').trim()
    return cleanPhone === cleanAgent || cleanPhone.endsWith(cleanAgent.replace('+', ''))
  })
}
