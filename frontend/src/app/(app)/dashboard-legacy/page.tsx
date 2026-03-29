import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PlantGrid } from '@/components/plant/PlantGrid'
import { Plus, Droplet, Sun, Calendar } from 'lucide-react'

export default async function HomePage() {
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

  // Fetch plants with master data
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
    .limit(6)

  // Fetch recent activities
  const { data: activities } = await supabase
    .from('activities')
    .select(`
      *,
      plants (
        custom_name,
        plants_master (common_name)
      )
    `)
    .eq('garden_id', garden?.id)
    .order('activity_date', { ascending: false })
    .limit(5)

  // Count plants needing attention
  const { count: needsWaterCount } = await supabase
    .from('plants')
    .select('*', { count: 'only', head: true })
    .eq('garden_id', garden?.id)
    .lt('last_watered', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-coal">
          Welcome back! 🌱
        </h1>
        <p className="text-coal/60">
          {garden?.name || 'Your Garden'}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center">
              <Sun size={24} className="text-forest" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coal">{plants?.length || 0}</p>
              <p className="text-sm text-coal/60">Total Plants</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-ocean-deep/10 flex items-center justify-center">
              <Droplet size={24} className="text-ocean-deep" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coal">{needsWaterCount || 0}</p>
              <p className="text-sm text-coal/60">Need Water</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-attention/10 flex items-center justify-center">
              <Calendar size={24} className="text-attention" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coal">{activities?.length || 0}</p>
              <p className="text-sm text-coal/60">Recent Activities</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Plants section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-coal">My Plants</h2>
          <Link href="/plants/add">
            <Button variant="primary">
              <Plus size={20} />
              Add Plant
            </Button>
          </Link>
        </div>

        <PlantGrid
          plants={plants || []}
          emptyMessage="No plants yet. Add your first plant to get started!"
        />

        {plants && plants.length > 0 && (
          <div className="text-center">
            <Link href="/plants">
              <Button variant="outline">View all plants</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Recent activity */}
      {activities && activities.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold text-coal">Recent Activity</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-3 border-b border-soft/50 last:border-0 last:pb-0"
              >
                <div className="w-8 h-8 rounded-full bg-ocean-mist flex items-center justify-center flex-shrink-0">
                  {activity.activity_type === 'watered' && <Droplet size={16} className="text-ocean-deep" />}
                  {activity.activity_type === 'fertilized' && <Sun size={16} className="text-attention" />}
                  {activity.activity_type === 'observed' && <Calendar size={16} className="text-forest" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-coal">
                    <span className="font-medium capitalize">{activity.activity_type}</span>{' '}
                    <span className="text-coal/60">
                      {/* @ts-ignore */}
                      {activity.plants?.custom_name || activity.plants?.plants_master?.common_name}
                    </span>
                  </p>
                  {activity.notes && (
                    <p className="text-sm text-coal/60 truncate">{activity.notes}</p>
                  )}
                  <p className="text-xs text-coal/40 mt-1">
                    {new Date(activity.activity_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
