import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { WeatherWidget } from '@/components/weather/WeatherWidget'
import { supabase } from '@/lib/supabase/client'

interface Seed {
  id: string
  common_name: string
  custom_name: string | null
  acquired_date: string | null
  seed_packet_data?: {
    variety_name: string | null
    brand: string | null
    days_to_germination_min: number | null
    days_to_germination_max: number | null
    indoor_start_weeks_before_frost: number | null
    direct_sow_after_frost: boolean
    requires_stratification: boolean
    requires_scarification: boolean
    requires_soaking: boolean
  }[]
}

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
    instructions: string | null
  } | null
}

type FilterType = 'all' | 'ready' | 'treatment' | 'waiting'

export default function SeedCollection() {
  const router = useRouter()
  const [seeds, setSeeds] = useState<Seed[]>([])
  const [recommendations, setRecommendations] = useState<SeedRecommendation[]>([])
  const [lastFrostDate, setLastFrostDate] = useState<string | null>(null)
  const [gardenLocation, setGardenLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!gardener) return

      // Get garden info
      const { data: garden } = await supabase
        .from('gardens')
        .select('id, location_lat, location_lng')
        .eq('gardener_id', gardener.id)
        .single()

      if (garden?.location_lat && garden?.location_lng) {
        setGardenLocation({ lat: garden.location_lat, lng: garden.location_lng })
      }

      // Get seeds (plants with status='seed')
      const { data: seedData } = await supabase
        .from('plants')
        .select(`
          id,
          common_name,
          custom_name,
          acquired_date,
          seed_packet_data (
            variety_name,
            brand,
            days_to_germination_min,
            days_to_germination_max,
            indoor_start_weeks_before_frost,
            direct_sow_after_frost,
            requires_stratification,
            requires_scarification,
            requires_soaking
          )
        `)
        .eq('garden_id', garden?.id)
        .eq('status', 'seed')
        .order('acquired_date', { ascending: false })

      setSeeds(seedData || [])

      // Get recommendations
      const { data: { session } } = await supabase.auth.getSession()
      if (session && garden) {
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
        }
      }
    } catch (error) {
      console.error('Error loading seeds:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [])

  const getFilteredSeeds = () => {
    if (filter === 'all') return seeds

    return seeds.filter(seed => {
      const rec = recommendations.find(r => r.plant_id === seed.id)
      const packet = seed.seed_packet_data?.[0]

      switch (filter) {
        case 'ready':
          return rec?.urgency === 'now' || rec?.urgency === 'this_week'
        case 'treatment':
          return packet?.requires_stratification || packet?.requires_scarification || packet?.requires_soaking
        case 'waiting':
          return rec?.urgency === 'later' || rec?.urgency === 'next_week'
        default:
          return true
      }
    })
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'past_due': return 'bg-red-100 text-red-700'
      case 'now': return 'bg-green-100 text-green-700'
      case 'this_week': return 'bg-yellow-100 text-yellow-700'
      case 'next_week': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'past_due': return 'Past Due'
      case 'now': return 'Start Now'
      case 'this_week': return 'This Week'
      case 'next_week': return 'Next Week'
      default: return 'Later'
    }
  }

  const filteredSeeds = getFilteredSeeds()
  const urgentCount = recommendations.filter(r => r.urgency === 'now' || r.urgency === 'this_week').length

  return (
    <View className="flex-1 bg-soft">
      <Header title="Seed Collection" showBack />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="gap-4">
          {/* Weather Widget */}
          {gardenLocation && (
            <WeatherWidget
              lat={gardenLocation.lat}
              lng={gardenLocation.lng}
              compact
            />
          )}

          {/* Frost Date Info */}
          {lastFrostDate && (
            <Card>
              <CardContent className="py-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-lg">🌸</Text>
                    <View>
                      <Text className="text-xs text-coal/60">Last Frost Date</Text>
                      <Text className="text-sm font-medium text-coal">
                        {new Date(lastFrostDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                  {urgentCount > 0 && (
                    <View className="bg-green-100 px-3 py-1 rounded-full">
                      <Text className="text-xs text-green-700 font-medium">
                        {urgentCount} ready to start
                      </Text>
                    </View>
                  )}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <View className="gap-2">
            <View className="flex-row gap-3">
              <Button
                variant="primary"
                onPress={() => router.push('/seeds/scan')}
                className="flex-1"
              >
                <Text className="text-white font-medium">Scan Packet</Text>
              </Button>
              <Button
                variant="primary"
                onPress={() => router.push('/seeds/batch-scan')}
                className="flex-1"
              >
                <Text className="text-white font-medium">Batch Scan</Text>
              </Button>
            </View>
            <Button
              variant="outline"
              onPress={() => router.push('/seeds/recommendations')}
            >
              <Text className="text-coal">View Starting Schedule</Text>
            </Button>
          </View>

          {/* Filter Tabs */}
          <View className="flex-row gap-2">
            {(['all', 'ready', 'treatment', 'waiting'] as FilterType[]).map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                className={`px-3 py-2 rounded-full ${
                  filter === f ? 'bg-forest' : 'bg-white border border-soft'
                }`}
              >
                <Text className={`text-xs font-medium ${
                  filter === f ? 'text-white' : 'text-coal'
                }`}>
                  {f === 'all' ? 'All' :
                   f === 'ready' ? 'Ready' :
                   f === 'treatment' ? 'Needs Treatment' : 'Waiting'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Seed List */}
          {isLoading ? (
            <View className="py-8">
              <Text className="text-center text-coal/50">Loading seeds...</Text>
            </View>
          ) : filteredSeeds.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <Text className="text-center text-coal/60 mb-2">
                  {filter === 'all'
                    ? 'No seeds in your collection yet'
                    : `No seeds matching "${filter}" filter`}
                </Text>
                <Button
                  variant="outline"
                  onPress={() => router.push('/seeds/scan')}
                >
                  <Text className="text-coal">Add Your First Seed</Text>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <View className="gap-3">
              {filteredSeeds.map((seed) => {
                const rec = recommendations.find(r => r.plant_id === seed.id)
                const packet = seed.seed_packet_data?.[0]

                return (
                  <Card
                    key={seed.id}
                    onPress={() => router.push(`/seeds/${seed.id}`)}
                  >
                    <CardContent className="py-3">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-coal">
                            {seed.custom_name || seed.common_name}
                          </Text>
                          {packet?.variety_name && (
                            <Text className="text-sm text-coal/60">
                              {packet.variety_name}
                            </Text>
                          )}
                          {packet?.brand && (
                            <Text className="text-xs text-coal/40">{packet.brand}</Text>
                          )}
                        </View>

                        {rec && (
                          <View className={`px-2 py-1 rounded-full ${getUrgencyColor(rec.urgency)}`}>
                            <Text className="text-xs font-medium">
                              {getUrgencyText(rec.urgency)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Treatment indicators */}
                      {(packet?.requires_stratification || packet?.requires_scarification || packet?.requires_soaking) && (
                        <View className="flex-row gap-2 mt-2">
                          {packet.requires_stratification && (
                            <View className="bg-blue-50 px-2 py-1 rounded">
                              <Text className="text-xs text-blue-700">Cold Stratify</Text>
                            </View>
                          )}
                          {packet.requires_scarification && (
                            <View className="bg-orange-50 px-2 py-1 rounded">
                              <Text className="text-xs text-orange-700">Scarify</Text>
                            </View>
                          )}
                          {packet.requires_soaking && (
                            <View className="bg-cyan-50 px-2 py-1 rounded">
                              <Text className="text-xs text-cyan-700">Pre-soak</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {rec && (
                        <View className="mt-2 pt-2 border-t border-soft">
                          <Text className="text-xs text-coal/60">
                            {rec.action} • {rec.ideal_start_date}
                          </Text>
                        </View>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}
