import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { formatRelativeTime } from '@/lib/utils'

export default function ActivitiesScreen() {
  const router = useRouter()
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/(auth)/login')
        return
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

      const { data: activitiesData } = await supabase
        .from('activities')
        .select(`
          *,
          plants (
            custom_name,
            photo_url,
            plants_master (common_names)
          )
        `)
        .eq('garden_id', garden?.id)
        .order('activity_date', { ascending: false })
        .limit(50)

      setActivities(activitiesData || [])
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-soft">
      <Header />

      <ScrollView className="flex-1" contentContainerClassName="pb-20">
        <View className="px-4 py-6 gap-6">
          <View>
            <Text className="text-3xl font-bold text-coal">Activity History</Text>
            <Text className="text-coal/60 mt-1">
              Track all care activities for your plants
            </Text>
          </View>

          {isLoading ? (
            <Text className="text-center text-coal/60">Loading...</Text>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="items-center py-12">
                <Text className="text-6xl mb-4">📅</Text>
                <Text className="text-xl font-semibold text-coal mb-2">
                  No activities yet
                </Text>
                <Text className="text-coal/60">
                  Start logging activities to track your plant care journey!
                </Text>
              </CardContent>
            </Card>
          ) : (
            <View className="gap-3">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="flex-row items-start gap-4">
                    <View className="w-10 h-10 rounded-full bg-ocean-mist items-center justify-center">
                      <Text className="text-xl">
                        {activity.activity_type === 'watered' && '💧'}
                        {activity.activity_type === 'fertilized' && '🌿'}
                        {activity.activity_type === 'pruned' && '✂️'}
                        {activity.activity_type === 'observed' && '👁️'}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text className="text-coal">
                        <Text className="font-semibold capitalize">{activity.activity_type}</Text>{' '}
                        <Text className="text-coal/60">
                          {activity.plants?.custom_name || activity.plants?.plants_master?.common_names?.[0]}
                        </Text>
                      </Text>
                      {activity.notes && (
                        <Text className="text-sm text-coal/60 mt-1">{activity.notes}</Text>
                      )}
                      <Text className="text-xs text-coal/40 mt-2">
                        {formatRelativeTime(activity.activity_date)}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}
