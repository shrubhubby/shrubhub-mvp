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
        plant_id,
        activity_type,
        notes,
        quantity,
        quantity_unit,
        product_used,
        performed_at,
        duration_minutes,
      } = req.body

      if (!plant_id || !activity_type) {
        return res.status(400).json({ error: 'plant_id and activity_type are required' })
      }

      // Verify plant belongs to user's garden
      const { data: plant } = await supabase
        .from('plants')
        .select('id, garden_id, gardens(gardener_id)')
        .eq('id', plant_id)
        .single()

      if (!plant || (plant.gardens as any)?.gardener_id !== gardener.id) {
        return res.status(403).json({ error: 'Plant not found or unauthorized' })
      }

      // Create activity
      const { data: activity, error } = await supabase
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

      if (error) {
        console.error('Error creating activity:', error)
        return res.status(500).json({ error: 'Failed to create activity', details: error.message })
      }

      return res.status(201).json({ success: true, activity })
    }

    if (req.method === 'GET') {
      const plant_id = req.query.plant_id as string
      const activity_type = req.query.activity_type as string
      const limit = parseInt((req.query.limit as string) || '50')

      let query = supabase
        .from('activities')
        .select('*, plants(id, common_name, custom_name, garden_id, gardens(id, name, gardener_id))')
        .order('performed_at', { ascending: false })
        .limit(limit)

      if (plant_id) {
        query = query.eq('plant_id', plant_id)
      }

      if (activity_type) {
        query = query.eq('activity_type', activity_type)
      }

      const { data: activities, error } = await query

      if (error) {
        console.error('Error fetching activities:', error)
        return res.status(500).json({ error: 'Failed to fetch activities', details: error.message })
      }

      // Filter to only activities for user's plants
      const userActivities = activities?.filter(
        (activity: any) => activity.plants?.gardens?.gardener_id === gardener.id
      ) || []

      return res.status(200).json({ activities: userActivities })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
