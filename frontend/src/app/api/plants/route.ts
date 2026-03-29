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
      garden_id,
      plant_master_id,
      common_name,
      custom_name,
      location_in_garden,
      location_lat,
      location_lng,
      acquired_date,
      acquisition_source,
      acquisition_location,
      acquisition_notes,
      status,
      health_status,
      planted_date,
      care_override,
    } = body

    // Validate required fields
    if (!garden_id || !common_name) {
      return NextResponse.json(
        { error: 'garden_id and common_name are required' },
        { status: 400 }
      )
    }

    // Verify garden belongs to user
    const { data: garden, error: gardenError } = await supabase
      .from('gardens')
      .select('id, gardener_id')
      .eq('id', garden_id)
      .single()

    if (gardenError || !garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 })
    }

    if (garden.gardener_id !== gardener.id) {
      return NextResponse.json(
        { error: 'Unauthorized - garden does not belong to user' },
        { status: 403 }
      )
    }

    // Create plant record
    const { data: plant, error: insertError } = await supabase
      .from('plants')
      .insert({
        garden_id,
        plant_master_id: plant_master_id || null,
        common_name,
        custom_name: custom_name || null,
        location_in_garden: location_in_garden || null,
        location_lat: location_lat || null,
        location_lng: location_lng || null,
        acquired_date: acquired_date || new Date().toISOString().split('T')[0],
        acquisition_source: acquisition_source || null,
        acquisition_location: acquisition_location || null,
        acquisition_notes: acquisition_notes || null,
        status: status || 'active',
        health_status: health_status || 'healthy',
        planted_date: planted_date || null,
        care_override: care_override || null,
      })
      .select(
        `
        *,
        gardens (
          id,
          name,
          gardener_id
        ),
        plants_master (
          id,
          scientific_name,
          common_names,
          care_guide
        )
      `
      )
      .single()

    if (insertError) {
      console.error('Error creating plant:', insertError)
      return NextResponse.json(
        { error: 'Failed to create plant', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, plant }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/plants:', error)
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
    const garden_id = searchParams.get('garden_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('plants')
      .select(
        `
        *,
        gardens (
          id,
          name,
          gardener_id
        ),
        plants_master (
          id,
          scientific_name,
          common_names,
          care_guide,
          default_image_url
        )
      `
      )
      .order('created_at', { ascending: false })

    // Filter by garden if specified
    if (garden_id) {
      query = query.eq('garden_id', garden_id)
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status)
    } else {
      // Default to only active plants
      query = query.eq('status', 'active')
    }

    // Search by name if specified
    if (search) {
      query = query.or(
        `common_name.ilike.%${search}%,custom_name.ilike.%${search}%`
      )
    }

    const { data: plants, error } = await query

    if (error) {
      console.error('Error fetching plants:', error)
      return NextResponse.json(
        { error: 'Failed to fetch plants', details: error.message },
        { status: 500 }
      )
    }

    // Filter to only plants in user's gardens
    const userPlants = plants.filter(
      (plant) => plant.gardens?.gardener_id === gardener.id
    )

    return NextResponse.json({ plants: userPlants }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/plants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
