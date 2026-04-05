import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { GardenCard } from '@/components/garden/GardenCard'
import { Fence, Plus } from 'lucide-react'

export default async function GardensPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gardener } = await supabase
    .from('gardeners')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  const { data: gardens } = await supabase
    .from('gardens')
    .select('*')
    .eq('gardener_id', gardener?.id)
    .order('created_at', { ascending: false })

  // Get plant counts per garden
  const gardenIds = gardens?.map(g => g.id) || []
  const { data: plants } = gardenIds.length > 0
    ? await supabase
        .from('plants')
        .select('id, garden_id')
        .in('garden_id', gardenIds)
    : { data: [] }

  const plantCountByGarden = (plants || []).reduce((acc: Record<string, number>, p: any) => {
    acc[p.garden_id] = (acc[p.garden_id] || 0) + 1
    return acc
  }, {})

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-coal">Gardens</h1>
          <p className="text-coal/60 mt-1">Manage your garden spaces</p>
        </div>
        <Link href="/gardens/add">
          <Button variant="primary">
            <Plus size={20} /> New Garden
          </Button>
        </Link>
      </div>

      {!gardens || gardens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Fence size={48} className="mx-auto text-forest/30 mb-4" />
            <h3 className="text-lg font-semibold text-coal mb-2">No gardens yet</h3>
            <p className="text-coal/60 mb-4">Create your first garden to start tracking plants.</p>
            <Link href="/gardens/add">
              <Button variant="primary">
                <Plus size={20} /> Create Garden
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gardens.map((garden: any) => (
            <GardenCard
              key={garden.id}
              garden={garden}
              plantCount={plantCountByGarden[garden.id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
