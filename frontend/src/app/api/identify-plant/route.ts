import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { image_base64 } = body

    if (!image_base64) {
      return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 })
    }

    // Forward to Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/identify-plant`

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ image_base64 }),
    })

    if (!response.ok) {
      // If edge function isn't deployed, fall back to a stub response
      // so the UI still works during development
      if (response.status === 404) {
        return NextResponse.json({
          suggestions: [],
          message: 'Plant identification service not configured. Enter details manually.',
        })
      }
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: 'Identification failed', details: errorData },
        { status: response.status }
      )
    }

    const raw = await response.json()

    // Normalize response into { suggestions: [...] } format
    // Handle various upstream shapes (Plant.id, custom edge function, etc.)
    let suggestions = raw.suggestions || []

    // Plant.id API format: { results: [{ species: { scientificName, commonNames }, score }] }
    if (raw.results && Array.isArray(raw.results)) {
      suggestions = raw.results.map((r: any) => ({
        common_name: r.species?.commonNames?.[0] || r.name || 'Unknown',
        scientific_name: r.species?.scientificName || r.scientific_name || '',
        confidence: r.score ?? r.probability ?? r.confidence ?? 0,
        plant_master_id: r.plant_master_id || null,
      }))
    }

    // If suggestions came in but with different field names
    if (suggestions.length > 0 && suggestions[0].name && !suggestions[0].common_name) {
      suggestions = suggestions.map((s: any) => ({
        common_name: s.name || s.common_name || 'Unknown',
        scientific_name: s.scientific_name || s.scientificName || '',
        confidence: s.score ?? s.probability ?? s.confidence ?? 0,
        plant_master_id: s.plant_master_id || null,
      }))
    }

    return NextResponse.json({ suggestions, raw_response: raw })
  } catch (error) {
    console.error('Error in POST /api/identify-plant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
