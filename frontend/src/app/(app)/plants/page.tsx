import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlantGrid } from '@/components/plant/PlantGrid'
import { Button } from '@/components/ui/Button'
import { Plus, Filter } from 'lucide-react'

export default async function PlantsPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch gardener profile
  const { data: gardener } = await supabase
    .from('gardeners')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  // Fetch user's garden
  const { data: garden } = await supabase
    .from('gardens')
    .select('*')
    .eq('gardener_id', gardener?.id)
    .single()

  // Fetch all plants
  const { data: plants } = await supabase
    .from('plants')
    .select(`
      *,
      plants_master (
        common_name,
        scientific_name,
        sunlight,
        water_frequency_days
      )
    `)
    .eq('garden_id', garden?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-coal">My Plants</h1>
          <p className="text-coal/60 mt-1">
            {plants?.length || 0} plant{plants?.length !== 1 ? 's' : ''} in your garden
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter size={20} />
            Filter
          </Button>
          <Link href="/plants/add">
            <Button variant="primary">
              <Plus size={20} />
              Add Plant
            </Button>
          </Link>
        </div>
      </div>

      {/* Plants grid */}
      <PlantGrid plants={plants || []} />
    </div>
  )
}
