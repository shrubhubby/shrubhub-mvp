import React from 'react'
import { View, Text, Image, Pressable } from 'react-native'
import { Link } from 'expo-router'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn, getDaysSince } from '@/lib/utils'
import type { Database } from '@/types/database.types'

type Plant = Database['public']['Tables']['plants']['Row'] & {
  plants_master?: Database['public']['Tables']['plants_master']['Row'] | null
}

interface PlantCardProps {
  plant: Plant
  className?: string
}

export function PlantCard({ plant, className }: PlantCardProps) {
  const daysSinceWatering = plant.last_watered
    ? getDaysSince(plant.last_watered)
    : null

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

  const getWaterStatus = () => {
    if (!daysSinceWatering) return null
    if (daysSinceWatering >= 7) return 'urgent'
    if (daysSinceWatering >= 5) return 'attention'
    return 'healthy'
  }

  const waterStatus = getWaterStatus()

  return (
    <Link href={`/plants/${plant.id}`} asChild>
      <Pressable>
        <Card className={cn('overflow-hidden active:opacity-90', className)} elevation={2}>
          {/* Plant image */}
          <View className="relative h-48 bg-soft overflow-hidden">
            {plant.photo_url ? (
              <Image
                source={{ uri: plant.photo_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Text className="text-6xl">🌱</Text>
              </View>
            )}
            {/* Health badge */}
            <View className="absolute top-3 right-3">
              <Badge variant={getHealthVariant(plant.health_status)}>
                {plant.health_status.replace('_', ' ')}
              </Badge>
            </View>
          </View>

          <CardContent className="gap-3">
            {/* Plant name */}
            <View>
              <Text className="font-semibold text-lg text-coal">
                {plant.custom_name || plant.plants_master?.common_names?.[0] || 'Unknown Plant'}
              </Text>
              {plant.plants_master?.scientific_name && (
                <Text className="text-sm text-coal/60 italic">
                  {plant.plants_master.scientific_name}
                </Text>
              )}
            </View>

            {/* Care status indicators */}
            <View className="flex-row items-center gap-3">
              {/* Water status */}
              {daysSinceWatering !== null && (
                <View className="flex-row items-center gap-1">
                  <Text
                    className={cn(
                      'text-base',
                      waterStatus === 'urgent' && 'text-urgent',
                      waterStatus === 'attention' && 'text-attention',
                      waterStatus === 'healthy' && 'text-ocean-mid'
                    )}
                  >
                    💧
                  </Text>
                  <Text className="text-sm text-coal/70">
                    {daysSinceWatering}d ago
                  </Text>
                </View>
              )}

              {/* Age */}
              {plant.acquired_date && (
                <View className="flex-row items-center gap-1">
                  <Text className="text-base text-ocean-mid">📅</Text>
                  <Text className="text-sm text-coal/70">
                    {getDaysSince(plant.acquired_date)}d old
                  </Text>
                </View>
              )}
            </View>

            {/* Notes preview */}
            {plant.acquisition_notes && (
              <Text className="text-sm text-coal/60" numberOfLines={2}>
                {plant.acquisition_notes}
              </Text>
            )}
          </CardContent>
        </Card>
      </Pressable>
    </Link>
  )
}
