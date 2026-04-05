import React from 'react'
import { View, Text } from 'react-native'
import { PlantCard } from './PlantCard'
import type { Database } from '@/types/database.types'

type Plant = Database['public']['Tables']['plants']['Row'] & {
  plants_master?: Database['public']['Tables']['plants_master']['Row'] | null
}

interface PlantGridProps {
  plants: Plant[]
  emptyMessage?: string
}

export function PlantGrid({ plants, emptyMessage = 'No plants yet' }: PlantGridProps) {
  if (plants.length === 0) {
    return (
      <View className="flex-col items-center justify-center py-12">
        <Text className="text-6xl mb-4">🌱</Text>
        <Text className="text-xl font-semibold text-coal mb-2">
          {emptyMessage}
        </Text>
        <Text className="text-coal/60">
          Start your garden journey by adding your first plant!
        </Text>
      </View>
    )
  }

  // Use View-based grid instead of FlatList to avoid zero-height issue
  // when nested inside ScrollView (especially on web)
  const rows: Plant[][] = []
  for (let i = 0; i < plants.length; i += 2) {
    rows.push(plants.slice(i, i + 2))
  }

  return (
    <View style={{ gap: 8 }}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', gap: 8 }}>
          {row.map((plant) => (
            <View key={plant.id} style={{ flex: 1, padding: 2 }}>
              <PlantCard plant={plant} />
            </View>
          ))}
          {/* Spacer for odd-count last row */}
          {row.length === 1 && <View style={{ flex: 1, padding: 2 }} />}
        </View>
      ))}
    </View>
  )
}
