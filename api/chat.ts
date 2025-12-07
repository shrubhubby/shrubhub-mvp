import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
const anthropicApiKey = process.env.ANTHROPIC_API_KEY!

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized - no auth header' })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    })

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get gardener ID
    const { data: gardener } = await supabase
      .from('gardeners')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!gardener) {
      return res.status(404).json({ error: 'Gardener not found' })
    }

    const { message, session_id } = req.body

    if (!message) {
      return res.status(400).json({ error: 'message is required' })
    }

    // Get or create conversation session
    let sessionId = session_id
    if (!sessionId) {
      // Create new session
      const { data: newSession, error: sessionError } = await supabase
        .from('conversation_sessions')
        .insert({
          gardener_id: gardener.id,
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Error creating session:', sessionError)
        return res.status(500).json({ error: 'Failed to create session' })
      }

      sessionId = newSession.id
    } else {
      // Update last_message_at for existing session
      await supabase
        .from('conversation_sessions')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', sessionId)
    }

    // Fetch conversation history (last 20 messages)
    const { data: conversationHistory } = await supabase
      .from('conversation_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20)

    // Fetch user's gardens and plants for context
    const { data: gardens } = await supabase
      .from('gardens')
      .select('id, name, description, garden_type, location_description')
      .eq('gardener_id', gardener.id)
      .is('archived_at', null)

    const { data: plants } = await supabase
      .from('plants')
      .select('id, common_name, custom_name, status, health_status, gardens(name), plants_master(scientific_name, care_guide)')
      .eq('status', 'active')
      .in('garden_id', gardens?.map(g => g.id) || [])

    // Build context for Claude
    const gardenContext = gardens?.length
      ? `Gardens: ${gardens.map(g => `${g.name} (${g.garden_type}${g.description ? ': ' + g.description : ''})`).join(', ')}`
      : 'No gardens yet'

    const plantContext = plants?.length
      ? `Plants: ${plants.map(p => `${p.custom_name || p.common_name} in ${p.gardens?.name || 'unknown garden'} (${p.health_status})`).join(', ')}`
      : 'No plants yet'

    const systemPrompt = `You are a helpful gardening assistant for ShrubHub. You have access to the user's garden data.

${gardenContext}
${plantContext}

Help the user with their gardening questions, provide advice, and assist with managing their gardens and plants. Be friendly, knowledgeable, and concise.`

    // Build messages array for Claude
    const messages: Anthropic.MessageParam[] = []

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        if (msg.role !== 'system') {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })
        }
      })
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    })

    // Call Claude API
    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    })

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : ''

    // Store user message
    await supabase.from('conversation_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
    })

    // Store assistant message
    await supabase.from('conversation_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: assistantMessage,
    })

    return res.status(200).json({
      success: true,
      message: assistantMessage,
      session_id: sessionId,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
