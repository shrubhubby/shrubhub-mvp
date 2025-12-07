import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
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

    if (req.method === 'POST') {
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
      } = req.body

      if (!garden_id || !common_name) {
        return res.status(400).json({ error: 'garden_id and common_name are required' })
      }

      // Verify garden belongs to user
      const { data: garden } = await supabase
        .from('gardens')
        .select('id, gardener_id')
        .eq('id', garden_id)
        .single()

      if (!garden || garden.gardener_id !== gardener.id) {
        return res.status(403).json({ error: 'Garden not found or unauthorized' })
      }

      // Create plant
      const { data: plant, error } = await supabase
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
        .select('*, gardens(id, name, gardener_id), plants_master(id, scientific_name, common_names, care_guide)')
        .single()

      if (error) {
        console.error('Error creating plant:', error)
        return res.status(500).json({ error: 'Failed to create plant', details: error.message })
      }

      return res.status(201).json({ success: true, plant })
    }

    if (req.method === 'GET') {
      const garden_id = req.query.garden_id as string
      const status = req.query.status as string
      const search = req.query.search as string

      let query = supabase
        .from('plants')
        .select('*, gardens(id, name, gardener_id), plants_master(id, scientific_name, common_names, care_guide, default_image_url)')
        .order('created_at', { ascending: false })

      if (garden_id) {
        query = query.eq('garden_id', garden_id)
      }

      if (status) {
        query = query.eq('status', status)
      } else {
        query = query.eq('status', 'active')
      }

      if (search) {
        query = query.or(`common_name.ilike.%${search}%,custom_name.ilike.%${search}%`)
      }

      const { data: plants, error } = await query

      if (error) {
        console.error('Error fetching plants:', error)
        return res.status(500).json({ error: 'Failed to fetch plants', details: error.message })
      }

      // Filter to only plants in user's gardens
      const userPlants = plants?.filter((plant: any) => plant.gardens?.gardener_id === gardener.id) || []

      return res.status(200).json({ plants: userPlants })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
