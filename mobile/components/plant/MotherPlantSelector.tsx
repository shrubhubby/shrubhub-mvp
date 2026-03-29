import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, FlatList, Image, TextInput } from 'react-native'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase/client'

interface Plant {
  id: string
  common_name: string
  custom_name: string | null
  health_status: string
  acquired_date: string
  garden_id: string
  garden?: {
    name: string
  }
  plants_master?: {
    scientific_name: string
    common_names: string[]
    default_image_url: string | null
  } | null
}

interface MotherPlantSelectorProps {
  gardenerId: string
  onSelect: (plant: Plant) => void
  selectedPlantId?: string
}

export function MotherPlantSelector({
  gardenerId,
  onSelect,
  selectedPlantId,
}: MotherPlantSelectorProps) {
  const [plants, setPlants] = useState<Plant[]>([])
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPlants()
  }, [gardenerId])

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const filtered = plants.filter(
        (p) =>
          p.common_name.toLowerCase().includes(query) ||
          p.custom_name?.toLowerCase().includes(query) ||
          p.plants_master?.scientific_name?.toLowerCase().includes(query)
      )
      setFilteredPlants(filtered)
    } else {
      setFilteredPlants(plants)
    }
  }, [searchQuery, plants])

  const loadPlants = async () => {
    setIsLoading(true)
    try {
      // First get the user's gardens
      const { data: gardens } = await supabase
        .from('gardens')
        .select('id, name')
        .eq('gardener_id', gardenerId)

      if (!gardens || gardens.length === 0) {
        setPlants([])
        return
      }

      const gardenIds = gardens.map((g) => g.id)
      const gardenMap = Object.fromEntries(gardens.map((g) => [g.id, g]))

      // Get plants from user's gardens
      const { data: plantsData, error } = await supabase
        .from('plants')
        .select(`
          id,
          common_name,
          custom_name,
          health_status,
          acquired_date,
          garden_id,
          plants_master (
            scientific_name,
            common_names,
            default_image_url
          )
        `)
        .in('garden_id', gardenIds)
        .not('health_status', 'eq', 'dead')
        .order('common_name', { ascending: true })

      if (error) throw error

      // Add garden names to plants
      const plantsWithGardens = (plantsData || []).map((p) => ({
        ...p,
        garden: gardenMap[p.garden_id],
      }))

      setPlants(plantsWithGardens)
      setFilteredPlants(plantsWithGardens)
    } catch (error) {
      console.error('Error loading plants:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'healthy'
      case 'needs_attention':
        return 'attention'
      case 'sick':
      case 'pest_issue':
        return 'urgent'
      default:
        return 'neutral'
    }
  }

  const renderPlantItem = ({ item }: { item: Plant }) => {
    const isSelected = item.id === selectedPlantId
    const displayName = item.custom_name || item.common_name
    const scientificName = item.plants_master?.scientific_name
    const imageUrl = item.plants_master?.default_image_url

    return (
      <Pressable onPress={() => onSelect(item)} className="mb-2">
        <Card
          className={`${isSelected ? 'border-2 border-forest' : ''}`}
        >
          <CardContent className="flex-row items-center gap-3 py-3">
            {/* Plant image or placeholder */}
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                className="w-14 h-14 rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <View className="w-14 h-14 bg-soft rounded-lg items-center justify-center">
                <Text className="text-2xl">🌱</Text>
              </View>
            )}

            {/* Plant info */}
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-coal text-base">
                  {displayName}
                </Text>
                <Badge variant={getHealthBadgeVariant(item.health_status)}>
                  {item.health_status.replace('_', ' ')}
                </Badge>
              </View>
              {scientificName && (
                <Text className="text-sm text-coal/60 italic">
                  {scientificName}
                </Text>
              )}
              {item.garden?.name && (
                <Text className="text-xs text-coal/40">
                  {item.garden.name}
                </Text>
              )}
            </View>

            {/* Selection indicator */}
            {isSelected && (
              <View className="w-6 h-6 bg-forest rounded-full items-center justify-center">
                <Text className="text-white text-xs">✓</Text>
              </View>
            )}
          </CardContent>
        </Card>
      </Pressable>
    )
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <Text className="text-coal/60">Loading your plants...</Text>
      </View>
    )
  }

  if (plants.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8 px-4">
        <Text className="text-4xl mb-4">🌿</Text>
        <Text className="text-lg font-medium text-coal text-center">
          No plants found
        </Text>
        <Text className="text-sm text-coal/60 text-center mt-2">
          You need to have at least one plant to take clones from.
          Add a mother plant first!
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1">
      {/* Search input */}
      <View className="px-4 py-3 bg-soft border-b border-soft/50">
        <Input
          placeholder="Search plants..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Plant list */}
      <FlatList
        data={filteredPlants}
        keyExtractor={(item) => item.id}
        renderItem={renderPlantItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="py-8 items-center">
            <Text className="text-coal/60">No plants match your search</Text>
          </View>
        }
      />
    </View>
  )
}
