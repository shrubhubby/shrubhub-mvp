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
        name,
        description,
        garden_type,
        location_lat,
        location_lng,
        location_description,
        sun_exposure,
        soil_type,
        is_primary,
      } = req.body

      if (!name) {
        return res.status(400).json({ error: 'name is required' })
      }

      // If this is set as primary, unset other primary gardens
      if (is_primary) {
        await supabase
          .from('gardens')
          .update({ is_primary: false })
          .eq('gardener_id', gardener.id)
      }

      // Create garden
      const { data: garden, error } = await supabase
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

      if (error) {
        console.error('Error creating garden:', error)
        return res.status(500).json({ error: 'Failed to create garden', details: error.message })
      }

      return res.status(201).json({ success: true, garden })
    }

    if (req.method === 'GET') {
      const include_archived = req.query.include_archived === 'true'

      let query = supabase
        .from('gardens')
        .select('*, plants(count)')
        .eq('gardener_id', gardener.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

      if (!include_archived) {
        query = query.is('archived_at', null)
      }

      const { data: gardens, error } = await query

      if (error) {
        console.error('Error fetching gardens:', error)
        return res.status(500).json({ error: 'Failed to fetch gardens', details: error.message })
      }

      return res.status(200).json({ gardens })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
