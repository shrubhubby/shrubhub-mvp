import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

const GARDEN_TYPES = [
  { value: 'indoor', label: 'Indoor', emoji: '🏠' },
  { value: 'outdoor', label: 'Outdoor', emoji: '🌳' },
  { value: 'container', label: 'Container', emoji: '🪴' },
  { value: 'raised_bed', label: 'Raised Bed', emoji: '📦' },
  { value: 'in_ground', label: 'In Ground', emoji: '🌱' },
  { value: 'greenhouse', label: 'Greenhouse', emoji: '🏡' },
  { value: 'community_plot', label: 'Community Plot', emoji: '👥' },
  { value: 'mixed', label: 'Mixed', emoji: '🌿' },
]

export default function EditGardenScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [gardenType, setGardenType] = useState('mixed')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadGardenData()
      }
    }, [id])
  )

  const loadGardenData = async () => {
    try {
      const { data: gardenData } = await supabase
        .from('gardens')
        .select('*')
        .eq('id', id)
        .single()

      if (gardenData) {
        setName(gardenData.name || '')
        setDescription(gardenData.description || '')
        setLocation(gardenData.location_description || '')
        setGardenType(gardenData.garden_type || 'mixed')
      }
    } catch (error) {
      console.error('Error loading garden:', error)
      alert('Failed to load garden details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateGarden = async () => {
    if (!name.trim()) {
      alert('Please enter a garden name')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('gardens')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          location_description: location.trim() || null,
          garden_type: gardenType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      router.back()
    } catch (error) {
      console.error('Error updating garden:', error)
      alert('Failed to update garden. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-soft">
        <Header showBack title="Edit Garden" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-coal/60">Loading...</Text>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-soft">
        <Header showBack title="Edit Garden" />

        <ScrollView className="flex-1" contentContainerClassName="pb-20">
          <View className="px-4 py-6 gap-6 max-w-4xl">
            <Card>
              <CardContent className="gap-4">
                <Input
                  label="Garden Name *"
                  placeholder="e.g., Backyard Garden, Balcony Pots"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <Input
                  label="Location"
                  placeholder="e.g., Backyard, South Window, Community Plot #5"
                  value={location}
                  onChangeText={setLocation}
                  autoCapitalize="words"
                />

                <Input
                  label="Description (Optional)"
                  placeholder="Notes about this garden..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {/* Garden Type Selection */}
                <View>
                  <Text className="text-sm font-medium text-coal mb-2">Garden Type</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {GARDEN_TYPES.map((type) => (
                      <Button
                        key={type.value}
                        variant={gardenType === type.value ? 'primary' : 'outline'}
                        size="sm"
                        onPress={() => setGardenType(type.value)}
                        className="flex-grow-0"
                      >
                        <Text className={gardenType === type.value ? 'text-white' : 'text-coal'}>
                          {type.emoji} {type.label}
                        </Text>
                      </Button>
                    ))}
                  </View>
                </View>

                <View className="flex-row gap-3 mt-2">
                  <Button
                    variant="outline"
                    onPress={() => router.back()}
                    className="flex-1"
                  >
                    <Text className="text-coal font-medium">Cancel</Text>
                  </Button>
                  <Button
                    variant="primary"
                    onPress={handleUpdateGarden}
                    disabled={isSaving || !name.trim()}
                    className="flex-1"
                  >
                    <Text className="text-white font-medium">
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </Button>
                </View>
              </CardContent>
            </Card>
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </KeyboardAvoidingView>
  )
}
