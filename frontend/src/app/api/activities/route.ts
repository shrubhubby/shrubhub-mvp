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

    // Parse request body
    const body = await request.json()
    const {
      plant_id,
      activity_type,
      notes,
      quantity,
      quantity_unit,
      product_used,
      performed_at,
      duration_minutes,
    } = body

    // Validate required fields
    if (!plant_id || !activity_type) {
      return NextResponse.json(
        { error: 'plant_id and activity_type are required' },
        { status: 400 }
      )
    }

    // Verify plant belongs to user's garden
    const { data: plant, error: plantError } = await supabase
      .from('plants')
      .select('id, garden_id, gardens(gardener_id)')
      .eq('id', plant_id)
      .single()

    if (plantError || !plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    // Check plant belongs to authenticated user's garden
    const { data: gardener } = await supabase
      .from('gardeners')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!gardener || plant.gardens.gardener_id !== gardener.id) {
      return NextResponse.json(
        { error: 'Unauthorized - plant does not belong to user' },
        { status: 403 }
      )
    }

    // Create activity record
    const { data: activity, error: insertError } = await supabase
      .from('activities')
      .insert({
        plant_id,
        activity_type,
        notes: notes || null,
        quantity: quantity || null,
        quantity_unit: quantity_unit || null,
        product_used: product_used || null,
        performed_at: performed_at || new Date().toISOString(),
        duration_minutes: duration_minutes || null,
        created_via: 'web_app',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating activity:', insertError)
      return NextResponse.json(
        { error: 'Failed to create activity', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, activity }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/activities:', error)
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
    const plant_id = searchParams.get('plant_id')
    const activity_type = searchParams.get('activity_type')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    let query = supabase
      .from('activities')
      .select(
        `
        *,
        plants (
          id,
          common_name,
          custom_name,
          garden_id,
          gardens (
            id,
            name,
            gardener_id
          )
        )
      `
      )
      .order('performed_at', { ascending: false })
      .limit(limit)

    // Filter by plant if specified
    if (plant_id) {
      query = query.eq('plant_id', plant_id)
    }

    // Filter by activity type if specified
    if (activity_type) {
      query = query.eq('activity_type', activity_type)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activities', details: error.message },
        { status: 500 }
      )
    }

    // Filter to only activities for user's plants
    const userActivities = activities.filter(
      (activity) => activity.plants?.gardens?.gardener_id === gardener.id
    )

    return NextResponse.json({ activities: userActivities }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
