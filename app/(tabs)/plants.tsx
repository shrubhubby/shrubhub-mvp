import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Link, useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { PlantGrid } from '@/components/plant/PlantGrid'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

export default function PlantsScreen() {
  const router = useRouter()
  const [plants, setPlants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

          {isLoading ? (
            <Text className="text-center text-coal/60">Loading...</Text>
          ) : (
            <PlantGrid plants={plants} />
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}
