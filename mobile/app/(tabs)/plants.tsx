import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { Link, useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { PlantGrid } from '@/components/plant/PlantGrid'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

type FilterType = 'all' | 'active' | 'seeds'

export default function PlantsScreen() {
  const router = useRouter()
  const [plants, setPlants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  useFocusEffect(
    useCallback(() => {
      loadPlants()
    }, [])
  )

  const loadPlants = async () => {
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

      const { data: plantsData } = await supabase
        .from('plants')
        .select(`
          *,
          plants_master (
            common_names,
            scientific_name
          )
        `)
        .eq('garden_id', garden?.id)
        .order('created_at', { ascending: false })

      setPlants(plantsData || [])
    } catch (error) {
      console.error('Error loading plants:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPlants = plants.filter(plant => {
    switch (filter) {
      case 'active':
        return plant.status !== 'seed'
      case 'seeds':
        return plant.status === 'seed'
      default:
        return true
    }
  })

  const seedCount = plants.filter(p => p.status === 'seed').length
  const activeCount = plants.filter(p => p.status !== 'seed').length

  return (
    <View className="flex-1 bg-soft">
      <Header />

      <ScrollView className="flex-1" contentContainerClassName="pb-20">
        <View className="px-4 py-6 gap-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-coal">My Plants</Text>
              <Text className="text-coal/60 mt-1">
                {plants.length} plant{plants.length !== 1 ? 's' : ''} in your garden
              </Text>
            </View>
            <Link href="/plants/add" asChild>
              <Button variant="primary">
                <Text className="text-white font-medium">+ Add</Text>
              </Button>
            </Link>
          </View>

          {/* Filter Tabs */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setFilter('all')}
              className={`px-4 py-2 rounded-full ${
                filter === 'all' ? 'bg-forest' : 'bg-white border border-soft'
              }`}
            >
              <Text className={`text-sm font-medium ${
                filter === 'all' ? 'text-white' : 'text-coal'
              }`}>
                All ({plants.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('active')}
              className={`px-4 py-2 rounded-full ${
                filter === 'active' ? 'bg-forest' : 'bg-white border border-soft'
              }`}
            >
              <Text className={`text-sm font-medium ${
                filter === 'active' ? 'text-white' : 'text-coal'
              }`}>
                Active ({activeCount})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('seeds')}
              className={`px-4 py-2 rounded-full ${
                filter === 'seeds' ? 'bg-forest' : 'bg-white border border-soft'
              }`}
            >
              <Text className={`text-sm font-medium ${
                filter === 'seeds' ? 'text-white' : 'text-coal'
              }`}>
                Seeds ({seedCount})
              </Text>
            </Pressable>
          </View>

          {/* Quick link to seed collection when on seeds tab */}
          {filter === 'seeds' && seedCount > 0 && (
            <Pressable
              onPress={() => router.push('/seeds')}
              className="bg-forest/10 p-3 rounded-lg flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">🌱</Text>
                <Text className="text-sm text-forest font-medium">
                  View Seed Collection & Recommendations
                </Text>
              </View>
              <Text className="text-forest">→</Text>
            </Pressable>
          )}

          {isLoading ? (
            <Text className="text-center text-coal/60">Loading...</Text>
          ) : filteredPlants.length === 0 ? (
            <View className="py-8">
              <Text className="text-center text-coal/60 mb-4">
                {filter === 'seeds'
                  ? 'No seeds in your collection'
                  : filter === 'active'
                  ? 'No active plants yet'
                  : 'No plants in your garden'}
              </Text>
              {filter === 'seeds' && (
                <Pressable onPress={() => router.push('/seeds/scan')}>
                  <Text className="text-center text-forest font-medium">
                    Scan a seed packet to get started
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <PlantGrid plants={filteredPlants} />
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}
