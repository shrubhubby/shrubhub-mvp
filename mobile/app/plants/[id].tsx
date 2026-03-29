import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, Image } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { getDaysSince } from '@/lib/utils'

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [plant, setPlant] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadPlantDetails()
      }
    }, [id])
  )

  const loadPlantDetails = async () => {
    try {
      // First, try to fetch with relationships
      const { data: plantData, error: plantError } = await supabase
        .from('plants')
        .select('*')
        .eq('id', id)
        .single()

      if (plantError || !plantData) {
        console.error('Error loading plant:', plantError)
        setPlant(null)
        setIsLoading(false)
        return
      }

      // Try to fetch related data separately
      let plantWithRelations = { ...plantData }

      // Fetch plants_master data if plants_master_id exists
      if (plantData.plants_master_id) {
        const { data: masterData } = await supabase
          .from('plants_master')
          .select('common_names, scientific_name, sunlight_min, sunlight_max, hardiness_zone_min, hardiness_zone_max')
          .eq('id', plantData.plants_master_id)
          .single()

        if (masterData) {
          plantWithRelations.plants_master = masterData
        }
      }

      // Fetch garden data if garden_id exists
      if (plantData.garden_id) {
        const { data: gardenData } = await supabase
          .from('gardens')
          .select('name')
          .eq('id', plantData.garden_id)
          .single()

        if (gardenData) {
          plantWithRelations.gardens = gardenData
        }
      }

      setPlant(plantWithRelations)
    } catch (error) {
      console.error('Error loading plant:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getHealthVariant = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'healthy'
      case 'needs_attention':
        return 'attention'
      case 'sick':
        return 'urgent'
      default:
        return 'neutral'
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-soft">
        <Header showBack title="Plant Details" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-coal/60">Loading...</Text>
        </View>
      </View>
    )
  }

  if (!plant) {
    return (
      <View className="flex-1 bg-soft">
        <Header showBack title="Plant Details" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-coal/60">Plant not found</Text>
        </View>
      </View>
    )
  }

  const daysSinceWatering = plant.last_watered ? getDaysSince(plant.last_watered) : null
  const daysSinceAcquired = plant.acquired_date ? getDaysSince(plant.acquired_date) : null

  return (
    <View className="flex-1 bg-soft">
      <Header showBack title="Plant Details" />

      <ScrollView className="flex-1" contentContainerClassName="pb-20">
        <View className="gap-6">
          {/* Plant image */}
          <View className="relative h-80 bg-soft">
            {plant.photo_url ? (
              <Image
                source={{ uri: plant.photo_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Text className="text-9xl">🌱</Text>
              </View>
            )}
          </View>

          <View className="px-4 gap-6">
            {/* Plant name and health */}
            <View>
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-3xl font-bold text-coal">
                    {plant.custom_name || plant.plants_master?.common_names?.[0] || 'Unknown Plant'}
                  </Text>
                  {plant.plants_master?.scientific_name && (
                    <Text className="text-lg text-coal/60 italic mt-1">
                      {plant.plants_master.scientific_name}
                    </Text>
                  )}
                </View>
                <Badge variant={getHealthVariant(plant.health_status)}>
                  {plant.health_status.replace('_', ' ')}
                </Badge>
              </View>

              {plant.gardens?.name && (
                <Text className="text-coal/60">
                  in {plant.gardens.name}
                </Text>
              )}
            </View>

            {/* Care status */}
            <Card>
              <CardHeader>
                <Text className="text-xl font-semibold text-coal">Care Status</Text>
              </CardHeader>
              <CardContent className="gap-3">
                {daysSinceWatering !== null && (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">💧</Text>
                      <Text className="text-coal">Last Watered</Text>
                    </View>
                    <Text className="text-coal font-medium">{daysSinceWatering} days ago</Text>
                  </View>
                )}

                {daysSinceAcquired !== null && (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">📅</Text>
                      <Text className="text-coal">Age</Text>
                    </View>
                    <Text className="text-coal font-medium">{daysSinceAcquired} days</Text>
                  </View>
                )}

                {plant.location_in_garden && (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">📍</Text>
                      <Text className="text-coal">Location</Text>
                    </View>
                    <Text className="text-coal font-medium">{plant.location_in_garden}</Text>
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Plant info */}
            {plant.plants_master && (
              <Card>
                <CardHeader>
                  <Text className="text-xl font-semibold text-coal">Plant Information</Text>
                </CardHeader>
                <CardContent className="gap-3">
                  {(plant.plants_master.sunlight_min || plant.plants_master.sunlight_max) && (
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">☀️</Text>
                        <Text className="text-coal">Sunlight</Text>
                      </View>
                      <Text className="text-coal font-medium">
                        {plant.plants_master.sunlight_min || 0} - {plant.plants_master.sunlight_max || 12} hours
                      </Text>
                    </View>
                  )}

                  {(plant.plants_master.hardiness_zone_min || plant.plants_master.hardiness_zone_max) && (
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">🌡️</Text>
                        <Text className="text-coal">Hardiness Zone</Text>
                      </View>
                      <Text className="text-coal font-medium">
                        {plant.plants_master.hardiness_zone_min} - {plant.plants_master.hardiness_zone_max}
                      </Text>
                    </View>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {plant.acquisition_notes && (
              <Card>
                <CardHeader>
                  <Text className="text-xl font-semibold text-coal">Notes</Text>
                </CardHeader>
                <CardContent>
                  <Text className="text-coal">{plant.acquisition_notes}</Text>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <View className="flex-row gap-3">
              <Button variant="outline" onPress={() => router.back()} className="flex-1">
                <Text className="text-coal font-medium">Back</Text>
              </Button>
              <Button variant="primary" onPress={() => {}} className="flex-1">
                <Text className="text-white font-medium">Water Now</Text>
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}
