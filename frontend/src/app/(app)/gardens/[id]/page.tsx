import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { GardenDetail } from '@/components/garden/GardenDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GardenDetailPage({ params }: Props) {
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

  // Fetch garden
  const { data: garden } = await supabase
    .from('gardens')
    .select('*')
    .eq('id', id)
    .eq('gardener_id', gardener.id)
    .single()

  if (!garden) notFound()

  // Fetch plants in this garden
  const { data: plants } = await supabase
    .from('plants')
    .select(`
      id, common_name, custom_name, health_status, status,
      acquired_date, location_in_garden,
      plants_master (common_names, scientific_name)
    `)
    .eq('garden_id', id)
    .order('created_at', { ascending: false })

  return (
    <GardenDetail
      garden={garden}
      plants={plants || []}
    />
  )
}
