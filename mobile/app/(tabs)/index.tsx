import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Link, useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PlantGrid } from '@/components/plant/PlantGrid'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

export default function HomeScreen() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [garden, setGarden] = useState<any>(null)
  const [plants, setPlants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      checkUser()
    }, [])
  )

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/(auth)/login')
      return
    }

    setUser(user)
    loadData(user.id)
  }

  const loadData = async (userId: string) => {
    try {
      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', userId)
        .single()

      // If no gardener, redirect to setup
      if (!gardener) {
        router.replace('/onboarding/setup-garden')
        return
      }

      const { data: gardenData } = await supabase
        .from('gardens')
        .select('*')
        .eq('gardener_id', gardener.id)
        .single()

      // If no garden, redirect to setup
      if (!gardenData) {
        router.replace('/onboarding/setup-garden')
        return
      }

      setGarden(gardenData)

      const { data: plantsData } = await supabase
        .from('plants')
        .select(`
          *,
          plants_master (
            common_names,
            scientific_name
          )
        `)
        .eq('garden_id', gardenData.id)
        .order('created_at', { ascending: false })
        .limit(6)

      setPlants(plantsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-soft">
      <Header user={user} />

      <ScrollView className="flex-1" contentContainerClassName="pb-20">
        <View className="px-4 py-6 gap-6">
          {/* Welcome header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-coal">
              Welcome back! 🌱
            </Text>
            <Text className="text-coal/60">
              {garden?.name || 'Your Garden'}
            </Text>
          </View>

          {/* Quick stats */}
          <View className="flex-row gap-4">
            <Card className="flex-1">
              <CardContent className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-full bg-forest/10 items-center justify-center">
                  <Text className="text-2xl">☀️</Text>
                </View>
                <View>
                  <Text className="text-2xl font-bold text-coal">{plants.length}</Text>
                  <Text className="text-sm text-coal/60">Total Plants</Text>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* My Plants section */}
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-semibold text-coal">My Plants</Text>
              <Link href="/plants/add" asChild>
                <Button variant="primary" size="sm">
                  <Text className="text-white font-medium">+ Add Plant</Text>
                </Button>
              </Link>
            </View>

            {isLoading ? (
              <Text className="text-center text-coal/60">Loading...</Text>
            ) : (
              <>
                <PlantGrid
                  plants={plants}
                  emptyMessage="No plants yet. Add your first plant to get started!"
                />

                {plants.length > 0 && (
                  <View className="items-center">
                    <Link href="/plants" asChild>
                      <Button variant="outline">View all plants</Button>
                    </Link>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}
