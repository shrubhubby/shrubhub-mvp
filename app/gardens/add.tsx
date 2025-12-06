import React, { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
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

export default function AddGardenScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [gardenType, setGardenType] = useState('mixed')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateGarden = async () => {
    if (!name.trim()) {
      alert('Please enter a garden name')
      return
    }

    setIsLoading(true)
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

      if (!gardener) {
        alert('Gardener profile not found')
        return
      }

      // Create garden
      const { error } = await supabase
        .from('gardens')
        .insert({
          gardener_id: gardener.id,
          name: name.trim(),
          description: description.trim() || null,
          location_description: location.trim() || null,
          garden_type: gardenType,
          is_primary: false, // New gardens are not primary by default
        })

      if (error) throw error

      router.back()
    } catch (error) {
      console.error('Error creating garden:', error)
      alert('Failed to create garden. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-soft">
        <Header showBack title="Add Garden" />

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
                    onPress={handleCreateGarden}
                    disabled={isLoading || !name.trim()}
                    className="flex-1"
                  >
                    <Text className="text-white font-medium">
                      {isLoading ? 'Creating...' : 'Create Garden'}
                    </Text>
                  </Button>
                </View>
              </CardContent>
            </Card>

            {/* Future: Site Selection */}
            <Card>
              <CardContent>
                <Text className="text-sm text-coal/60">
                  💡 In the future, you'll be able to group gardens into "Sites" (e.g., your home, a community garden location) to share weather and environmental data.
                </Text>
              </CardContent>
            </Card>
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </KeyboardAvoidingView>
  )
}
