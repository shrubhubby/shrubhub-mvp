import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card, CardContent } from '@/components/ui/Card'
import { WeatherWidget } from '@/components/weather/WeatherWidget'
import { supabase } from '@/lib/supabase/client'

interface SeedRecommendation {
  plant_id: string
  plant_name: string
  variety_name: string | null
  urgency: 'now' | 'this_week' | 'next_week' | 'later' | 'past_due'
  action: string
  ideal_start_date: string
  days_until_start: number
  special_treatment: {
    type: 'stratification' | 'scarification' | 'soaking' | null
    treatment_start_date: string | null
    days_until_treatment: number | null
    instructions: string | null
  } | null
  soil_temp_ok: boolean | null
  frost_risk: boolean
}

export default function SeedRecommendations() {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<SeedRecommendation[]>([])
  const [lastFrostDate, setLastFrostDate] = useState<string | null>(null)
  const [currentSoilTemp, setCurrentSoilTemp] = useState<number | null>(null)
  const [gardenLocation, setGardenLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      const { data: garden } = await supabase
        .from('gardens')
        .select('id, location_lat, location_lng')
        .eq('gardener_id', gardener?.id)
        .single()

      if (garden?.location_lat && garden?.location_lng) {
        setGardenLocation({ lat: garden.location_lat, lng: garden.location_lng })
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !garden) return

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/seed-recommendations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ garden_id: garden.id }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
        setLastFrostDate(data.last_frost_date)
        setCurrentSoilTemp(data.current_soil_temp_f)
      }
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadRecommendations()
    setRefreshing(false)
  }

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'past_due': return { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' }
      case 'now': return { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700' }
      case 'this_week': return { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' }
      case 'next_week': return { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' }
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600' }
    }
  }

  const getUrgencyText = (urgency: string, daysUntil: number) => {
    switch (urgency) {
      case 'past_due': return `${Math.abs(daysUntil)} days overdue`
      case 'now': return 'Start now!'
      case 'this_week': return `In ${daysUntil} days`
      case 'next_week': return `In ${daysUntil} days`
      default: return `In ${daysUntil} days`
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const groupedRecommendations = {
    urgent: recommendations.filter(r => r.urgency === 'past_due' || r.urgency === 'now'),
    thisWeek: recommendations.filter(r => r.urgency === 'this_week'),
    nextWeek: recommendations.filter(r => r.urgency === 'next_week'),
    later: recommendations.filter(r => r.urgency === 'later'),
  }

  return (
    <View className="flex-1 bg-soft">
      <Header title="Seed Starting Schedule" showBack />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="gap-4">
          {/* Weather */}
          {gardenLocation && (
            <WeatherWidget lat={gardenLocation.lat} lng={gardenLocation.lng} />
          )}

          {/* Frost Date & Soil Temp Info */}
          <Card>
            <CardContent className="py-3">
              <View className="flex-row justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg">🌸</Text>
                  <View>
                    <Text className="text-xs text-coal/60">Last Frost</Text>
                    <Text className="text-sm font-medium text-coal">
                      {lastFrostDate ? formatDate(lastFrostDate) : 'Not set'}
                    </Text>
                  </View>
                </View>
                {currentSoilTemp !== null && (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-lg">🌡️</Text>
                    <View>
                      <Text className="text-xs text-coal/60">Soil Temp</Text>
                      <Text className="text-sm font-medium text-coal">
                        {Math.round(currentSoilTemp)}°F
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          {isLoading ? (
            <View className="py-8">
              <Text className="text-center text-coal/50">Loading schedule...</Text>
            </View>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <Text className="text-center text-coal/60 mb-2">
                  No seeds in your collection yet
                </Text>
                <Pressable onPress={() => router.push('/seeds/scan')}>
                  <Text className="text-center text-forest font-medium">
                    Scan a seed packet to get started
                  </Text>
                </Pressable>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Urgent / Start Now */}
              {groupedRecommendations.urgent.length > 0 && (
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-coal">
                    Start Now
                  </Text>
                  {groupedRecommendations.urgent.map((rec) => (
                    <RecommendationCard
                      key={rec.plant_id}
                      rec={rec}
                      onPress={() => router.push(`/seeds/${rec.plant_id}`)}
                    />
                  ))}
                </View>
              )}

              {/* This Week */}
              {groupedRecommendations.thisWeek.length > 0 && (
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-coal">
                    This Week
                  </Text>
                  {groupedRecommendations.thisWeek.map((rec) => (
                    <RecommendationCard
                      key={rec.plant_id}
                      rec={rec}
                      onPress={() => router.push(`/seeds/${rec.plant_id}`)}
                    />
                  ))}
                </View>
              )}

              {/* Next Week */}
              {groupedRecommendations.nextWeek.length > 0 && (
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-coal">
                    Next Week
                  </Text>
                  {groupedRecommendations.nextWeek.map((rec) => (
                    <RecommendationCard
                      key={rec.plant_id}
                      rec={rec}
                      onPress={() => router.push(`/seeds/${rec.plant_id}`)}
                    />
                  ))}
                </View>
              )}

              {/* Later */}
              {groupedRecommendations.later.length > 0 && (
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-coal">
                    Coming Up
                  </Text>
                  {groupedRecommendations.later.map((rec) => (
                    <RecommendationCard
                      key={rec.plant_id}
                      rec={rec}
                      onPress={() => router.push(`/seeds/${rec.plant_id}`)}
                      compact
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}

function RecommendationCard({
  rec,
  onPress,
  compact = false
}: {
  rec: SeedRecommendation
  onPress: () => void
  compact?: boolean
}) {
  const style = {
    past_due: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100' },
    now: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100' },
    this_week: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100' },
    next_week: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100' },
    later: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100' },
  }[rec.urgency]

  const badgeText = {
    past_due: 'text-red-700',
    now: 'text-green-700',
    this_week: 'text-yellow-700',
    next_week: 'text-blue-700',
    later: 'text-gray-600',
  }[rec.urgency]

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        className={`${style.bg} border ${style.border} rounded-lg p-3 flex-row justify-between items-center`}
      >
        <View>
          <Text className="text-sm font-medium text-coal">{rec.plant_name}</Text>
          <Text className="text-xs text-coal/60">{rec.ideal_start_date}</Text>
        </View>
        <Text className="text-xs text-coal/60">{rec.days_until_start} days</Text>
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      className={`${style.bg} border ${style.border} rounded-xl p-4`}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-coal">{rec.plant_name}</Text>
          {rec.variety_name && (
            <Text className="text-sm text-coal/60">{rec.variety_name}</Text>
          )}
        </View>
        <View className={`${style.badge} px-2 py-1 rounded-full`}>
          <Text className={`text-xs font-medium ${badgeText}`}>
            {rec.urgency === 'past_due' ? `${Math.abs(rec.days_until_start)}d overdue` :
             rec.urgency === 'now' ? 'Start Now' :
             `${rec.days_until_start} days`}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-sm text-coal">{rec.action}</Text>
        <Text className="text-xs text-coal/50">•</Text>
        <Text className="text-sm text-coal/70">{rec.ideal_start_date}</Text>
      </View>

      {/* Special treatment alert */}
      {rec.special_treatment && (
        <View className="bg-white/50 rounded-lg p-2 mt-1">
          <Text className="text-xs font-medium text-coal">
            {rec.special_treatment.type === 'stratification' && '❄️ Cold Stratification Required'}
            {rec.special_treatment.type === 'scarification' && '✂️ Scarification Required'}
            {rec.special_treatment.type === 'soaking' && '💧 Pre-soaking Required'}
          </Text>
          {rec.special_treatment.instructions && (
            <Text className="text-xs text-coal/70 mt-1">
              {rec.special_treatment.instructions}
            </Text>
          )}
        </View>
      )}

      {/* Frost warning */}
      {rec.frost_risk && (
        <View className="flex-row items-center gap-1 mt-2">
          <Text className="text-sm">⚠️</Text>
          <Text className="text-xs text-orange-700">Frost risk - wait for conditions to improve</Text>
        </View>
      )}

      {/* Soil temp indicator */}
      {rec.soil_temp_ok !== null && (
        <View className="flex-row items-center gap-1 mt-1">
          <Text className="text-sm">{rec.soil_temp_ok ? '✓' : '✗'}</Text>
          <Text className={`text-xs ${rec.soil_temp_ok ? 'text-green-700' : 'text-orange-700'}`}>
            {rec.soil_temp_ok ? 'Soil temperature OK' : 'Soil too cold'}
          </Text>
        </View>
      )}
    </Pressable>
  )
}
