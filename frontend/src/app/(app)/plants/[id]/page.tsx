import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PlantDetail } from '@/components/plant/PlantDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlantDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gardener } = await supabase
    .from('gardeners')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!gardener) redirect('/login')

  // Fetch plant with master data and garden
  const { data: plant } = await supabase
    .from('plants')
    .select(`
      *,
      plants_master (
        id, scientific_name, common_names, family, plant_type,
        care_guide, hardiness_zones, growth_rate,
        mature_height_inches, mature_width_inches, default_image_url
      ),
      gardens (
        id, name, gardener_id, location_lat, location_lng
      )
    `)
    .eq('id', id)
    .single()

  if (!plant || plant.gardens?.gardener_id !== gardener.id) notFound()

  // Fetch photos
  const { data: photos } = await supabase
    .from('plant_photos')
    .select('*')
    .eq('plant_id', id)
    .order('taken_at', { ascending: false })

  // Fetch activities
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('plant_id', id)
    .order('performed_at', { ascending: false })
    .limit(100)

  // Fetch lineage — parent chain (walk up)
  const lineage: any[] = []
  let currentParentId = plant.parent_plant_id
  while (currentParentId) {
    const { data: parent } = await supabase
      .from('plants')
      .select('id, common_name, custom_name, parent_plant_id, acquisition_source, acquired_date')
      .eq('id', currentParentId)
      .single()

    if (!parent) break
    lineage.push(parent)
    currentParentId = parent.parent_plant_id
    if (lineage.length > 20) break // safety limit
  }

  // Fetch children (plants whose parent is this plant)
  const { data: children } = await supabase
    .from('plants')
    .select('id, common_name, custom_name, acquisition_source, acquired_date, status')
    .eq('parent_plant_id', id)
    .order('acquired_date', { ascending: false })

  return (
    <PlantDetail
      plant={plant}
      photos={photos || []}
      activities={activities || []}
      lineage={lineage}
      children={children || []}
    />
  )
}
