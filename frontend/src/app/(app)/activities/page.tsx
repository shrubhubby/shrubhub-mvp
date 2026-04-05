import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Droplet, Calendar, Scissors, Sprout } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

const activityIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  watering: Droplet,
  fertilizing: Sprout,
  pruning: Scissors,
}

const activityColors: Record<string, string> = {
  watering: 'text-ocean-deep bg-ocean-deep/10',
  fertilizing: 'text-forest bg-forest/10',
  pruning: 'text-attention bg-attention/10',
}

export default async function ActivitiesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gardener } = await supabase
    .from('gardeners')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  // Get all gardens
  const { data: gardens } = await supabase
    .from('gardens')
    .select('id')
    .eq('gardener_id', gardener?.id)

  const gardenIds = gardens?.map(g => g.id) || []

  // Get all plant IDs for user's gardens
  const { data: userPlants } = gardenIds.length > 0
    ? await supabase
        .from('plants')
        .select('id')
        .in('garden_id', gardenIds)
    : { data: [] }

  const plantIds = userPlants?.map(p => p.id) || []

  // Fetch activities for user's plants
  const { data: activities } = plantIds.length > 0
    ? await supabase
        .from('activities')
        .select(`
          *,
          plants (
            id, custom_name, common_name
          )
        `)
        .in('plant_id', plantIds)
        .order('performed_at', { ascending: false })
        .limit(50)
    : { data: [] }

  // Group by date
  const groupedActivities: Record<string, any[]> = {}
  if (activities) {
    activities.forEach((activity) => {
      const date = new Date(activity.performed_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      if (!groupedActivities[date]) groupedActivities[date] = []
      groupedActivities[date].push(activity)
    })
  }

  const hasActivities = Object.keys(groupedActivities).length > 0

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-coal">Activity History</h1>
        <p className="text-coal/60 mt-1">Track all care activities for your plants</p>
      </div>

      {!hasActivities ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar size={48} className="mx-auto text-coal/20 mb-4" />
            <h3 className="text-lg font-semibold text-coal mb-2">No activities yet</h3>
            <p className="text-coal/60">Start logging activities to track your plant care journey!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedActivities).map(([date, dateActivities]) => (
            <div key={date} className="space-y-3">
              <h2 className="text-sm font-semibold text-coal/60 uppercase tracking-wide">{date}</h2>
              <div className="space-y-2">
                {dateActivities.map((activity: any) => {
                  const Icon = activityIcons[activity.activity_type] || Calendar
                  const colorClass = activityColors[activity.activity_type] || 'text-coal bg-soft'
                  const plantName = activity.plants?.custom_name || activity.plants?.common_name || 'Unknown'

                  return (
                    <Card key={activity.id}>
                      <CardContent className="flex items-start gap-4 py-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-coal">
                            <span className="font-medium capitalize">{activity.activity_type.replace('_', ' ')}</span>{' '}
                            <span className="text-coal/60">{plantName}</span>
                          </p>
                          {activity.notes && (
                            <p className="text-xs text-coal/50 mt-0.5">{activity.notes}</p>
                          )}
                          {activity.product_used && (
                            <p className="text-xs text-coal/40 mt-0.5">Product: {activity.product_used}</p>
                          )}
                          <p className="text-xs text-coal/40 mt-1">
                            {formatRelativeTime(activity.performed_at)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
