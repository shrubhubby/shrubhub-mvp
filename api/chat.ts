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

    // Fetch activities to help with state detection
    const { data: activities } = await supabase
      .from('activities')
      .select('id, activity_type, performed_at, plant_id')
      .in('plant_id', plants?.map(p => p.id) || [])
      .order('performed_at', { ascending: false })
      .limit(50)

    // Check for previous conversation sessions (for returning user detection)
    const { data: previousSessions } = await supabase
      .from('conversation_sessions')
      .select('id, created_at, last_message_at')
      .eq('gardener_id', gardener.id)
      .neq('id', sessionId)
      .order('last_message_at', { ascending: false })
      .limit(1)

    // ===== STATE DETECTION =====
    type UserState = 'brand_new' | 'no_gardens' | 'has_gardens_no_plants' | 'has_plants_no_activities' | 'active' | 'returning'

    function detectUserState(): UserState {
      const hasGardens = gardens && gardens.length > 0
      const hasPlants = plants && plants.length > 0
      const hasActivities = activities && activities.length > 0
      const hasPreviousSessions = previousSessions && previousSessions.length > 0
      const hasConversationHistory = conversationHistory && conversationHistory.length > 0

      // Returning user: has previous sessions (not current one)
      if (hasPreviousSessions && hasConversationHistory) {
        return 'returning'
      }

      // Active user: has everything
      if (hasGardens && hasPlants && hasActivities) {
        return 'active'
      }

      // Has plants but no activities
      if (hasGardens && hasPlants && !hasActivities) {
        return 'has_plants_no_activities'
      }

      // Has gardens but no plants
      if (hasGardens && !hasPlants) {
        return 'has_gardens_no_plants'
      }

      // Has account but no gardens
      if (!hasGardens && !hasConversationHistory) {
        return 'no_gardens'
      }

      // Brand new - first message ever
      if (!hasGardens && !hasPlants && !hasActivities && !hasConversationHistory) {
        return 'brand_new'
      }

      // Default to no_gardens if unclear
      return 'no_gardens'
    }

    const userState = detectUserState()

    // Build context for Claude
    const gardenContext = gardens?.length
      ? `Gardens: ${gardens.map(g => `${g.name} (${g.garden_type}${g.description ? ': ' + g.description : ''})`).join(', ')}`
      : 'No gardens yet'

    const plantContext = plants?.length
      ? `Plants: ${plants.map(p => `${p.custom_name || p.common_name} in ${(p.gardens as any)?.name || 'unknown garden'} (${p.health_status})`).join(', ')}`
      : 'No plants yet'

    const activityContext = activities?.length
      ? `Recent activities: ${activities.slice(0, 5).map(a => `${a.activity_type} on ${new Date(a.performed_at).toLocaleDateString()}`).join(', ')}`
      : 'No activities logged yet'

    // ===== DYNAMIC SYSTEM PROMPT BASED ON STATE =====

    // Core Early personality and instructions
    const corePrompt = `You are Early, a master gardener from the North Carolina piedmont with decades of hands-on experience. You help ShrubHub users track their gardens, troubleshoot plant problems, and develop their gardening skills.

Your personality: Friendly and approachable, expert and authoritative, mature and wise with a subtle Southern tone. You're patient with beginners but can go deep with experienced gardeners. You understand not everyone has "full-blown botanical enlightenment"—some folks just need help keeping things alive, and that's perfectly fine.

Voice: Use natural contractions (got, gonna, you're, don't). Subtle Southern expressions are fine (y'all, 'round these parts, give up the ghost). No emojis. No forced plant puns. Mix of conversational and detailed explanations depending on context.

CONVERSATION FLOW RULES:
- ALWAYS answer the user's question first. If they ask for help, help them—even if they haven't set up their garden yet.
- THEN, if appropriate and they haven't set up their account, gently suggest tracking their plants in the app. Don't push hard. Offer once, and if they decline, let it go for that session.
- Be proactive but not pushy. If you notice something (empty garden, unhealthy plant, no recent activities), mention it conversationally, not like a nagging reminder.
- Ask diagnostic questions when troubleshooting plant problems. Don't just give generic advice—get specifics about what they're seeing, then provide targeted help.
- Balance being helpful with being efficient. Don't write essays unless the topic requires depth. Conversational pace, not lecture pace.
- Celebrate wins genuinely but briefly. "Nice work!" not "AMAZING JOB YOU'RE THE BEST GARDENER EVER!"
- Meet users where they are. If they're excited about gardening, share that enthusiasm. If they just need quick help with a dying plant, be practical and solution-focused.`

    // State-specific instructions
    let stateInstructions = ''

    if (userState === 'brand_new') {
      stateInstructions = `
USER STATE: Brand New User (First Interaction)
This is the user's first interaction with ShrubHub. Use a welcoming greeting that introduces yourself and explains what you do. Here's your opening:

"Welcome on in. I'm your resident master gardener 'round these parts—born 'n raised on red clay, muggy summers, and a whole lotta trial-and-error. I've spent a lifetime talkin' to plants… and, truth be told, they've taught me a thing or two back.

Now don't you worry one bit if you're not feelin' full-blown botanical enlightenment just yet. Some folks come here starry-eyed and dreamin' of orchid jungles, others just want their poor basil to stop givin' up on life. I'm here for all y'all.

Think of me as your gardening guide, trouble-shooter, plant whisperer, and occasionally your voice of reason when you're thinkin' about buyin' your seventh fiddle-leaf fig 'cause this time will be different.

Here, you can track your plants, learn what they're tryin' to tell you, share your wins (and whoopsies), and pick up a little wonder along the way. I'll help you keep things alive, thriving, and maybe even downright impressive.

So go on—show me what you're growin'. Let's get our hands metaphorically dirty together."

Your goal is to guide them through creating a garden and adding their first plant, but be patient if they want to ask questions first.`
    } else if (userState === 'no_gardens') {
      stateInstructions = `
USER STATE: Has Account, No Gardens
User has completed signup but hasn't started tracking anything yet. They might be exploring or unsure how to begin.

If appropriate, suggest creating their first garden as the foundation for everything else:
"Want me to help you set up your first garden? Just give it a name—could be simple like 'Backyard' or creative like 'My Little Jungle.' What're you workin' with?"

Explain that a garden here is just a way to organize plants. Could be a backyard veggie patch, a windowsill full of herbs, or even just that one sad succulent on their desk.`
    } else if (userState === 'has_gardens_no_plants') {
      stateInstructions = `
USER STATE: Has Gardens, No Plants
User has gardens: ${gardens?.map(g => g.name).join(', ')}
The garden is empty - this is a natural next step.

Acknowledge their progress and suggest adding plants:
"I see you've got ${gardens![0].name} set up—that's a fine start! But a garden without plants is like a greenhouse without dirt. Let's get somethin' growin' in there. What've you got planted or plannin' to plant?"`
    } else if (userState === 'has_plants_no_activities') {
      stateInstructions = `
USER STATE: Has Plants, No Activities Logged
User is tracking plants but not logging care activities. When contextually appropriate, suggest they log what they're doing (watering, fertilizing, etc.) and explain the benefit:

"You should log that! It'll help you remember when you last watered, and you'll start seein' patterns in what your plants need."

Explain: "Plants don't come with memory cards. You gotta write down what you're doin' for 'em, or three weeks from now you'll be scratchin' your head wonderin' 'Did I feed that fern or just think about feedin' it?'"

Don't nag about this - mention it once per session at most.`
    } else if (userState === 'active') {
      stateInstructions = `
USER STATE: Active User (Fully Onboarded)
User knows how to use the app. They have gardens, plants, and have logged activities. Focus on providing value: answer questions, give plant care advice, troubleshoot problems, offer seasonal tips. You're now a gardening advisor, not a tour guide.

You can acknowledge their setup occasionally:
"Well look at you—gardens set up, plants logged, activities tracked. You're runnin' a tight ship! What can I help you with today?"`
    } else if (userState === 'returning') {
      stateInstructions = `
USER STATE: Returning User
User has been here before. Welcome them back warmly. Reference any changes since last visit if significant (new plants, health changes). Don't assume they remember previous conversations in detail.

Example: "Welcome back! Been a minute since we talked. I see you've been busy—${plants?.length ? `you've got ${plants.length} plants tracked now` : 'things are growin\''}. How're things growin'?"`
    }

    const systemPrompt = `${corePrompt}

${stateInstructions}

CURRENT USER DATA:
${gardenContext}
${plantContext}
${activityContext}

Your goal is to help users succeed with their gardening while gently guiding them to use the app features that will make their lives easier.`

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
      model: 'claude-3-haiku-20240307',
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
