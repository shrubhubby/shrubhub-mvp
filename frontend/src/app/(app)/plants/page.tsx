import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Plus, Sprout, Droplet, MapPin } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

export default async function PlantsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gardener } = await supabase
    .from('gardeners')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  // Fetch ALL gardens for this gardener
  const { data: gardens } = await supabase
    .from('gardens')
    .select('id, name')
    .eq('gardener_id', gardener?.id)

  const gardenIds = gardens?.map(g => g.id) || []
  const gardenNameMap = (gardens || []).reduce((acc: Record<string, string>, g: any) => {
    acc[g.id] = g.name
    return acc
  }, {})

  // Fetch plants across ALL gardens
  const { data: plants } = gardenIds.length > 0
    ? await supabase
        .from('plants')
        .select(`
          id, common_name, custom_name, health_status, status,
          acquired_date, location_in_garden, garden_id,
          plants_master (common_names, scientific_name)
        `)
        .in('garden_id', gardenIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-coal">My Plants</h1>
          <p className="text-coal/60 mt-1">
            {plants?.length || 0} plant{plants?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/plants/add">
          <Button variant="primary">
            <Plus size={20} /> Add Plant
          </Button>
        </Link>
      </div>

      {!plants || plants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sprout size={48} className="mx-auto text-forest/30 mb-4" />
            <h3 className="text-lg font-semibold text-coal mb-2">No plants yet</h3>
            <p className="text-coal/60 mb-4">Add your first plant to start tracking.</p>
            <Link href="/plants/add">
              <Button variant="primary">
                <Plus size={20} /> Add Your First Plant
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {plants.map((plant: any) => {
            const name = plant.custom_name || plant.plants_master?.common_names?.[0] || plant.common_name || 'Unknown'
            const scientific = plant.plants_master?.scientific_name
            const gardenName = gardenNameMap[plant.garden_id]
            const healthColor =
              plant.health_status === 'healthy' ? 'healthy'
              : plant.health_status === 'needs_attention' ? 'attention'
              : plant.health_status === 'sick' || plant.health_status === 'pest_issue' ? 'urgent'
              : 'neutral'

            return (
              <Link key={plant.id} href={`/plants/${plant.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center gap-4 py-3">
                    <div className="w-12 h-12 rounded-lg bg-soft flex items-center justify-center flex-shrink-0">
                      <Sprout size={22} className="text-forest/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-coal truncate">{name}</p>
                        <Badge variant={healthColor} className="text-xs flex-shrink-0">
                          {plant.health_status?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-coal/50 mt-0.5">
                        {scientific && <span className="italic truncate">{scientific}</span>}
                        {gardenName && (
                          <span className="flex items-center gap-0.5 flex-shrink-0">
                            <MapPin size={10} /> {gardenName}
                          </span>
                        )}
                        {plant.acquired_date && (
                          <span className="flex items-center gap-0.5 flex-shrink-0">
                            <Droplet size={10} /> {formatRelativeTime(plant.acquired_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-coal/40 capitalize flex-shrink-0">
                      {plant.status?.replace('_', ' ')}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
