import React from 'react'
import { View, Text, FlatList } from 'react-native'
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

  return (
    <FlatList
      data={plants}
      renderItem={({ item }) => (
        <View className="p-2">
          <PlantCard plant={item} />
        </View>
      )}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 8 }}
      contentContainerStyle={{ gap: 8 }}
    />
  )
}
