import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Droplet, Sun, Calendar, Eye } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

const activityIcons = {
  watered: Droplet,
  fertilized: Sun,
  pruned: Calendar,
  observed: Eye,
}

const activityColors = {
  watered: 'text-ocean-deep bg-ocean-mist',
  fertilized: 'text-attention bg-attention/10',
  pruned: 'text-forest bg-forest/10',
  observed: 'text-coal bg-soft',
}

type ActivityType = keyof typeof activityIcons

export default async function ActivitiesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: gardener } = await supabase
    .from('gardeners')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  const { data: garden } = await supabase
    .from('gardens')
    .select('id')
    .eq('gardener_id', gardener?.id)
    .single()

  const { data: activities } = await supabase
    .from('activities')
    .select(`
      *,
      plants (
        custom_name,
        photo_url,
        plants_master (common_name)
      )
    `)
    .eq('garden_id', garden?.id)
    .order('activity_date', { ascending: false })
    .limit(50)

  const groupedActivities: Record<string, any[]> = {}

  if (activities) {
    activities.forEach((activity) => {
      const date = new Date(activity.activity_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      if (!groupedActivities[date]) {
        groupedActivities[date] = []
      }
      groupedActivities[date].push(activity)
    })
  }

  const hasActivities = Object.keys(groupedActivities).length > 0

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-coal">Activity History</h1>
        <p className="text-coal/60 mt-1">
          Track all care activities for your plants
        </p>
      </div>

      {!hasActivities ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-coal mb-2">
              No activities yet
            </h3>
            <p className="text-coal/60">
              Start logging activities to track your plant care journey!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedActivities).map(([date, dateActivities]) => (
            <div key={date} className="space-y-4">
              <div className="sticky top-20 bg-soft/95 backdrop-blur py-2 z-10">
                <h2 className="text-lg font-semibold text-coal">{date}</h2>
              </div>

              <div className="space-y-3">
                {dateActivities.map((activity: any) => {
                  const Icon = activityIcons[activity.activity_type as ActivityType] || Calendar
                  const colorClass = activityColors[activity.activity_type as ActivityType] || 'text-coal bg-soft'

                  return (
                    <Card key={activity.id} className="hover:shadow-md transition-all">
                      <CardContent className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon size={20} />
                        </div>

                        {activity.plants?.photo_url && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={activity.plants.photo_url}
                              alt={activity.plants.custom_name || 'Plant'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-coal">
                            <span className="font-semibold capitalize">{activity.activity_type}</span>{' '}
                            <span className="text-coal/60">
                              {activity.plants?.custom_name || activity.plants?.plants_master?.common_name}
                            </span>
                          </p>
                          {activity.notes && (
                            <p className="text-sm text-coal/60 mt-1">{activity.notes}</p>
                          )}
                          <p className="text-xs text-coal/40 mt-2">
                            {formatRelativeTime(activity.activity_date)}
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
