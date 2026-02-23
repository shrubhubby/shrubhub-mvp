import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Alert, Pressable } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

interface SeedDetail {
  id: string
  common_name: string
  custom_name: string | null
  acquired_date: string | null
  acquisition_notes: string | null
  seed_packet_data?: {
    brand: string | null
    variety_name: string | null
    days_to_germination_min: number | null
    days_to_germination_max: number | null
    days_to_maturity_min: number | null
    days_to_maturity_max: number | null
    planting_depth_inches: number | null
    spacing_inches: number | null
    indoor_start_weeks_before_frost: number | null
    direct_sow_after_frost: boolean
    soil_temperature_min_f: number | null
    requires_stratification: boolean
    stratification_days: number | null
    requires_scarification: boolean
    requires_soaking: boolean
    soaking_hours: number | null
  }[]
}

export default function SeedDetail() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [seed, setSeed] = useState<SeedDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) loadSeed()
  }, [id])

  const loadSeed = async () => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select(`
          id,
          common_name,
          custom_name,
          acquired_date,
          acquisition_notes,
          seed_packet_data (
            brand,
            variety_name,
            days_to_germination_min,
            days_to_germination_max,
            days_to_maturity_min,
            days_to_maturity_max,
            planting_depth_inches,
            spacing_inches,
            indoor_start_weeks_before_frost,
            direct_sow_after_frost,
            soil_temperature_min_f,
            requires_stratification,
            stratification_days,
            requires_scarification,
            requires_soaking,
            soaking_hours
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setSeed(data)
    } catch (error) {
      console.error('Error loading seed:', error)
      Alert.alert('Error', 'Could not load seed details.')
      router.back()
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartSeed = async () => {
    Alert.alert(
      'Start Seed',
      'Mark this seed as started? It will move to your active plants.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('plants')
                .update({ status: 'germinating' })
                .eq('id', id)

              if (error) throw error

              Alert.alert('Success', 'Seed started! Check your plants for updates.')
              router.replace('/(tabs)/plants')
            } catch (error) {
              console.error('Error starting seed:', error)
              Alert.alert('Error', 'Could not update seed status.')
            }
          }
        }
      ]
    )
  }

  const handleDelete = () => {
    Alert.alert(
      'Remove Seed',
      'Are you sure you want to remove this seed from your collection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('plants')
                .delete()
                .eq('id', id)

              if (error) throw error
              router.replace('/seeds')
            } catch (error) {
              console.error('Error deleting seed:', error)
              Alert.alert('Error', 'Could not remove seed.')
            }
          }
        }
      ]
    )
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-soft items-center justify-center">
        <Text className="text-coal/60">Loading...</Text>
      </View>
    )
  }

  if (!seed) return null

  const packet = seed.seed_packet_data?.[0]

  return (
    <View className="flex-1 bg-soft">
      <Header title={seed.custom_name || seed.common_name} showBack />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="gap-4">
          {/* Header info */}
          <Card>
            <CardContent>
              <Text className="text-xl font-bold text-coal">
                {seed.custom_name || seed.common_name}
              </Text>
              {packet?.variety_name && packet.variety_name !== seed.custom_name && (
                <Text className="text-sm text-coal/60">{packet.variety_name}</Text>
              )}
              {packet?.brand && (
                <Text className="text-sm text-coal/40">{packet.brand}</Text>
              )}
              {seed.acquired_date && (
                <Text className="text-xs text-coal/50 mt-2">
                  Added {new Date(seed.acquired_date).toLocaleDateString()}
                </Text>
              )}
            </CardContent>
          </Card>

          {/* Timing Info */}
          {packet && (
            <Card>
              <CardContent>
                <Text className="text-sm font-medium text-coal mb-3">Timing</Text>
                <View className="gap-2">
                  {(packet.days_to_germination_min || packet.days_to_germination_max) && (
                    <InfoRow
                      label="Germination"
                      value={`${packet.days_to_germination_min || '?'}-${packet.days_to_germination_max || '?'} days`}
                    />
                  )}
                  {(packet.days_to_maturity_min || packet.days_to_maturity_max) && (
                    <InfoRow
                      label="Days to Maturity"
                      value={`${packet.days_to_maturity_min || '?'}-${packet.days_to_maturity_max || '?'} days`}
                    />
                  )}
                  {packet.indoor_start_weeks_before_frost && (
                    <InfoRow
                      label="Start Indoors"
                      value={`${packet.indoor_start_weeks_before_frost} weeks before last frost`}
                    />
                  )}
                  {packet.direct_sow_after_frost && (
                    <InfoRow label="Direct Sow" value="After last frost" />
                  )}
                  {packet.soil_temperature_min_f && (
                    <InfoRow
                      label="Min Soil Temp"
                      value={`${packet.soil_temperature_min_f}°F`}
                    />
                  )}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Planting Info */}
          {packet && (packet.planting_depth_inches || packet.spacing_inches) && (
            <Card>
              <CardContent>
                <Text className="text-sm font-medium text-coal mb-3">Planting</Text>
                <View className="gap-2">
                  {packet.planting_depth_inches && (
                    <InfoRow
                      label="Planting Depth"
                      value={`${packet.planting_depth_inches}" deep`}
                    />
                  )}
                  {packet.spacing_inches && (
                    <InfoRow
                      label="Spacing"
                      value={`${packet.spacing_inches}" apart`}
                    />
                  )}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Special Treatments */}
          {packet && (packet.requires_stratification || packet.requires_scarification || packet.requires_soaking) && (
            <Card>
              <CardContent>
                <Text className="text-sm font-medium text-coal mb-3">Special Treatments</Text>
                <View className="gap-3">
                  {packet.requires_stratification && (
                    <TreatmentCard
                      emoji="❄️"
                      title="Cold Stratification"
                      description={`Place seeds in moist medium in refrigerator for ${packet.stratification_days || 'several'} days before planting.`}
                    />
                  )}
                  {packet.requires_scarification && (
                    <TreatmentCard
                      emoji="✂️"
                      title="Scarification"
                      description="Nick or sand the seed coat before planting to help water penetrate."
                    />
                  )}
                  {packet.requires_soaking && (
                    <TreatmentCard
                      emoji="💧"
                      title="Pre-soaking"
                      description={`Soak seeds in warm water for ${packet.soaking_hours || 'several'} hours before planting.`}
                    />
                  )}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {seed.acquisition_notes && (
            <Card>
              <CardContent>
                <Text className="text-sm font-medium text-coal mb-2">Notes</Text>
                <Text className="text-sm text-coal/70">{seed.acquisition_notes}</Text>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <View className="gap-3 mt-4">
            <Button variant="primary" onPress={handleStartSeed}>
              <Text className="text-white font-medium">Start This Seed</Text>
            </Button>

            <Button variant="outline" onPress={handleDelete}>
              <Text className="text-red-600">Remove from Collection</Text>
            </Button>
          </View>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-coal/60">{label}</Text>
      <Text className="text-sm text-coal">{value}</Text>
    </View>
  )
}

function TreatmentCard({
  emoji,
  title,
  description
}: {
  emoji: string
  title: string
  description: string
}) {
  return (
    <View className="bg-soft rounded-lg p-3">
      <View className="flex-row items-center gap-2 mb-1">
        <Text className="text-lg">{emoji}</Text>
        <Text className="text-sm font-medium text-coal">{title}</Text>
      </View>
      <Text className="text-xs text-coal/70">{description}</Text>
    </View>
  )
}
