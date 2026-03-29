import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get gardener ID
    const { data: gardener } = await supabase
      .from('gardeners')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!gardener) {
      return NextResponse.json({ error: 'Gardener not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const {
      name,
      description,
      garden_type,
      location_lat,
      location_lng,
      location_description,
      sun_exposure,
      soil_type,
      is_primary,
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    // If this is set as primary, unset other primary gardens
    if (is_primary) {
      await supabase
        .from('gardens')
        .update({ is_primary: false })
        .eq('gardener_id', gardener.id)
    }

    // Create garden record
    const { data: garden, error: insertError } = await supabase
      .from('gardens')
      .insert({
        gardener_id: gardener.id,
        name,
        description: description || null,
        garden_type: garden_type || 'outdoor',
        location_lat: location_lat || null,
        location_lng: location_lng || null,
        location_description: location_description || null,
        sun_exposure: sun_exposure || null,
        soil_type: soil_type || null,
        is_primary: is_primary || false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating garden:', insertError)
      return NextResponse.json(
        { error: 'Failed to create garden', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, garden }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/gardens:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get gardener ID
    const { data: gardener } = await supabase
      .from('gardeners')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!gardener) {
      return NextResponse.json({ error: 'Gardener not found' }, { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const include_archived = searchParams.get('include_archived') === 'true'

    // Build query
    let query = supabase
      .from('gardens')
      .select(
        `
        *,
        plants (count)
      `
      )
      .eq('gardener_id', gardener.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    // Filter archived gardens unless requested
    if (!include_archived) {
      query = query.is('archived_at', null)
    }

    const { data: gardens, error } = await query

    if (error) {
      console.error('Error fetching gardens:', error)
      return NextResponse.json(
        { error: 'Failed to fetch gardens', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ gardens }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/gardens:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
