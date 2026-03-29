import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Plus,
  Droplet,
  Sun,
  Calendar,
  Sprout,
  MessageCircle,
  MapPin,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { formatRelativeTime, getDaysSince } from '@/lib/utils'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: gardener } = await supabase
    .from('gardeners')
    .select('id, display_name')
    .eq('auth_user_id', user.id)
    .single()

  // Fetch all sites for this gardener
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('gardener_id', gardener?.id)
    .order('created_at', { ascending: false })

  // Fetch all gardens for this gardener
  const { data: gardens } = await supabase
    .from('gardens')
    .select('id, name, garden_type, site_id')
    .eq('gardener_id', gardener?.id)
    .order('created_at', { ascending: false })

  // Fetch plants with master data
  const gardenIds = gardens?.map(g => g.id) || []
  const { data: plants } = gardenIds.length > 0
    ? await supabase
        .from('plants')
        .select(`
          id, custom_name, health_status, last_watered, photo_url, garden_id,
          plants_master (common_name, scientific_name, water_frequency_days)
        `)
        .in('garden_id', gardenIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Fetch recent activities
  const { data: activities } = gardenIds.length > 0
    ? await supabase
        .from('activities')
        .select(`
          id, activity_type, activity_date, notes,
          plants (custom_name, plants_master (common_name))
        `)
        .in('garden_id', gardenIds)
        .order('activity_date', { ascending: false })
        .limit(8)
    : { data: [] }

  // Compute stats
  const totalPlants = plants?.length || 0
  const totalGardens = gardens?.length || 0
  const totalSites = sites?.length || 0

  const needsWater = plants?.filter(p => {
    if (!p.last_watered) return true
    const daysSince = getDaysSince(p.last_watered)
    // @ts-ignore
    const freq = p.plants_master?.water_frequency_days || 7
    return daysSince >= freq
  }) || []

  const needsAttention = plants?.filter(
    p => p.health_status === 'needs_attention' || p.health_status === 'sick'
  ) || []

  const displayName = gardener?.display_name || user.email?.split('@')[0] || 'Gardener'

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Greeting + Add Plant CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-coal">
            Welcome back, {displayName}
          </h1>
          <p className="text-coal/60 mt-1">
            {totalPlants === 0
              ? 'Get started by adding your first garden and plants.'
              : `You have ${totalPlants} plant${totalPlants !== 1 ? 's' : ''} across ${totalGardens} garden${totalGardens !== 1 ? 's' : ''}.`}
          </p>
        </div>
        <Link href="/plants/add" className="flex-shrink-0">
          <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg">
            <Plus size={22} /> Add Plant
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard icon={MapPin} label="Sites" value={totalSites} color="forest" />
        <StatCard icon={Sprout} label="Plants" value={totalPlants} color="leaf-dark" />
        <StatCard icon={Droplet} label="Need Water" value={needsWater.length} color="ocean-deep" alert={needsWater.length > 0} />
        <StatCard icon={AlertTriangle} label="Need Attention" value={needsAttention.length} color="attention" alert={needsAttention.length > 0} />
      </div>

      {/* Main content grid — stacks on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Plants + Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-coal">Quick Actions</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QuickAction href="/plants/add" icon={Plus} label="Add Plant" color="forest" />
                <QuickAction href="/chat" icon={MessageCircle} label="Ask AI" color="ocean-deep" />
                <QuickAction href="/activities" icon={Calendar} label="Log Activity" color="attention" />
                <QuickAction href="/plants" icon={Sprout} label="All Plants" color="leaf-dark" />
              </div>
            </CardContent>
          </Card>

          {/* Plants needing attention */}
          {needsWater.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-coal">Needs Watering</h2>
                  <span className="text-sm text-ocean-deep font-medium">{needsWater.length} plant{needsWater.length !== 1 ? 's' : ''}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-soft/50">
                  {needsWater.slice(0, 5).map(plant => (
                    <PlantRow key={plant.id} plant={plant} />
                  ))}
                </div>
                {needsWater.length > 5 && (
                  <div className="p-3 text-center">
                    <Link href="/plants" className="text-sm text-ocean-deep font-medium hover:underline">
                      View all {needsWater.length} plants
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* All plants overview */}
          {plants && plants.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-coal">Your Plants</h2>
                  <Link href="/plants">
                    <Button variant="ghost" size="sm">
                      View all <ChevronRight size={16} />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-soft/50">
                  {plants.slice(0, 8).map(plant => (
                    <PlantRow key={plant.id} plant={plant} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {totalPlants === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Sprout size={48} className="mx-auto text-forest/30 mb-4" />
                <h3 className="text-lg font-semibold text-coal mb-2">No plants yet</h3>
                <p className="text-coal/60 mb-4">Start tracking your garden by adding your first plant.</p>
                <Link href="/plants/add">
                  <Button variant="primary">
                    <Plus size={20} /> Add Your First Plant
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Activity feed + Gardens */}
        <div className="space-y-6">
          {/* Gardens summary */}
          {gardens && gardens.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-coal">Your Gardens</h2>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-soft/50">
                  {gardens.slice(0, 6).map(garden => {
                    const gardenPlantCount = plants?.filter(p => p.garden_id === garden.id).length || 0
                    const site = sites?.find(s => s.id === garden.site_id)
                    return (
                      <div key={garden.id} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-coal truncate">{garden.name}</p>
                          <p className="text-xs text-coal/50">
                            {site?.name && <span>{site.name} &middot; </span>}
                            {garden.garden_type && <span className="capitalize">{garden.garden_type.replace('_', ' ')}</span>}
                          </p>
                        </div>
                        <span className="text-xs text-coal/50 ml-2 whitespace-nowrap">
                          {gardenPlantCount} plant{gardenPlantCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-coal">Recent Activity</h2>
                <Link href="/activities">
                  <Button variant="ghost" size="sm">
                    All <ChevronRight size={16} />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activities && activities.length > 0 ? (
                <div className="divide-y divide-soft/50">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-soft">
                        <ActivityIcon type={activity.activity_type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-coal">
                          <span className="font-medium capitalize">{activity.activity_type}</span>{' '}
                          <span className="text-coal/60">
                            {/* @ts-ignore */}
                            {activity.plants?.custom_name || activity.plants?.plants_master?.common_name}
                          </span>
                        </p>
                        {activity.notes && (
                          <p className="text-xs text-coal/50 truncate mt-0.5">{activity.notes}</p>
                        )}
                        <p className="text-xs text-coal/40 mt-0.5">
                          {formatRelativeTime(activity.activity_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Calendar size={32} className="mx-auto text-coal/20 mb-2" />
                  <p className="text-sm text-coal/50">No activities logged yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// --- Helper Components ---

function StatCard({ icon: Icon, label, value, color, alert }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number
  color: string
  alert?: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${alert ? 'bg-urgent/10' : 'bg-soft'}`}>
          <Icon size={20} className={alert ? 'text-urgent' : `text-${color}`} />
        </div>
        <div>
          <p className={`text-xl font-bold ${alert ? 'text-urgent' : 'text-coal'}`}>{value}</p>
          <p className="text-xs text-coal/50">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickAction({ href, icon: Icon, label, color }: {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  color: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-soft hover:bg-soft/70 transition-colors"
    >
      <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm`}>
        <Icon size={20} className={`text-${color}`} />
      </div>
      <span className="text-xs font-medium text-coal text-center">{label}</span>
    </Link>
  )
}

function PlantRow({ plant }: { plant: any }) {
  // @ts-ignore
  const name = plant.custom_name || plant.plants_master?.common_name || 'Unknown Plant'
  const healthColor =
    plant.health_status === 'healthy' ? 'bg-healthy'
    : plant.health_status === 'needs_attention' ? 'bg-attention'
    : plant.health_status === 'sick' ? 'bg-urgent'
    : 'bg-coal/20'

  const lastWatered = plant.last_watered
    ? formatRelativeTime(plant.last_watered)
    : 'Never watered'

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Plant thumbnail or placeholder */}
      <div className="w-10 h-10 rounded-lg bg-soft flex items-center justify-center flex-shrink-0 overflow-hidden">
        {plant.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plant.photo_url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Sprout size={18} className="text-forest/40" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-coal truncate">{name}</p>
        <p className="text-xs text-coal/50">
          <Droplet size={10} className="inline mr-1" />
          {lastWatered}
        </p>
      </div>
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${healthColor}`} />
    </div>
  )
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'watered':
      return <Droplet size={14} className="text-ocean-deep" />
    case 'fertilized':
      return <Sun size={14} className="text-attention" />
    default:
      return <Calendar size={14} className="text-forest" />
  }
}
