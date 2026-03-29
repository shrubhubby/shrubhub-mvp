import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get gardener profile
    const { data: gardener } = await supabase
      .from('gardeners')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    // Get user's garden
    const { data: garden } = await supabase
      .from('gardens')
      .select('id')
      .eq('gardener_id', gardener?.id)
      .single()

    if (!garden) {
      return NextResponse.json(
        { error: 'No garden found' },
        { status: 404 }
      )
    }

    // Get user's plants for context
    const { data: plants } = await supabase
      .from('plants')
      .select(`
        *,
        plants_master (
          common_name,
          scientific_name,
          care_instructions
        )
      `)
      .eq('garden_id', garden.id)

    // Build context for AI
    const context = `
You are ShrubHub's AI gardening assistant. You help users care for their plants.

User's plants:
${plants?.map(p => `- ${p.custom_name || p.plants_master?.common_name} (${p.health_status}, last watered: ${p.last_watered || 'never'})`).join('\n')}

Respond conversationally and helpfully. If the user asks to perform actions like watering or adding plants, guide them appropriately.
`

    // TODO: Replace with actual AI API call (Anthropic Claude or OpenAI)
    // For now, return a simple response
    const response = generateMockResponse(message, plants || [])

    // Save conversation to database
    await supabase.from('conversation_history').insert({
      garden_id: garden.id,
      user_message: message,
      assistant_response: response,
    })

    return NextResponse.json({ message: response })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mock response generator - replace with actual AI API
function generateMockResponse(message: string, plants: any[]): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('show') && lowerMessage.includes('plant')) {
    if (plants.length === 0) {
      return "You don't have any plants yet! Would you like to add your first plant?"
    }
    return `You have ${plants.length} plant${plants.length > 1 ? 's' : ''}: ${plants.map(p => p.custom_name || p.plants_master?.common_name).join(', ')}. Would you like to know more about any of them?`
  }

  if (lowerMessage.includes('water')) {
    const needsWater = plants.filter(p => {
      if (!p.last_watered) return true
      const daysSince = Math.floor((Date.now() - new Date(p.last_watered).getTime()) / (1000 * 60 * 60 * 24))
      return daysSince >= 7
    })

    if (needsWater.length === 0) {
      return "All your plants are well-watered! 💧 Great job keeping up with their needs!"
    }

    return `${needsWater.length} plant${needsWater.length > 1 ? 's need' : ' needs'} watering: ${needsWater.map(p => p.custom_name || p.plants_master?.common_name).join(', ')}. Would you like me to log watering for any of them?`
  }

  if (lowerMessage.includes('add') && lowerMessage.includes('plant')) {
    return "Great! To add a new plant, you can either:\n1. Upload a photo and I'll identify it\n2. Search for a plant by name\n3. Manually enter plant details\n\nWhich would you prefer?"
  }

  if (lowerMessage.includes('tip') || lowerMessage.includes('advice')) {
    return "Here are some quick gardening tips:\n• Most indoor plants prefer indirect sunlight\n• Water when the top inch of soil is dry\n• Rotate your plants regularly for even growth\n• Clean leaves to help photosynthesis\n\nWould you like specific advice for any of your plants?"
  }

  return "I'm here to help with your plants! You can ask me about watering schedules, plant care tips, or I can help you add new plants to your garden. What would you like to know?"
}
