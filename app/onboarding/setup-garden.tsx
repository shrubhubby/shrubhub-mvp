import React, { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SetupGardenScreen() {
  const router = useRouter()
  const [gardenName, setGardenName] = useState('')
  const [location, setLocation] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateGarden = async () => {
    if (!gardenName.trim()) {
      alert('Please enter a garden name')
      return
    }

    setIsLoading(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/(auth)/login')
        return
      }

      // Check if gardener exists, create if not
      let { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!gardener) {
        const { data: newGardener, error: gardenerError } = await supabase
          .from('gardeners')
          .insert({
            auth_user_id: user.id,
            email: user.email,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (gardenerError) throw gardenerError
        gardener = newGardener
      }

      // Create garden
      const { error } = await supabase
        .from('gardens')
        .insert({
          gardener_id: gardener.id,
          name: gardenName.trim(),
          location: location.trim() || null,
          created_at: new Date().toISOString(),
        })

      if (error) throw error

      // Navigate to home
      router.replace('/(tabs)')
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
      <View className="flex-1 bg-ocean-mist">
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center items-center p-4"
        >
          <View className="w-full max-w-md gap-6">
            {/* Welcome header */}
            <View className="items-center gap-2">
              <Text className="text-6xl mb-4">🌱</Text>
              <Text className="text-3xl font-bold text-coal text-center">
                Welcome to ShrubHub!
              </Text>
              <Text className="text-coal/60 text-center">
                Let's create your first garden to get started
              </Text>
            </View>

            {/* Form */}
            <Card>
              <CardContent className="gap-4">
                <Input
                  label="Garden Name *"
                  placeholder="e.g., My Indoor Garden, Balcony Oasis"
                  value={gardenName}
                  onChangeText={setGardenName}
                  autoCapitalize="words"
                />

                <Input
                  label="Location (Optional)"
                  placeholder="e.g., Living Room, Balcony, Backyard"
                  value={location}
                  onChangeText={setLocation}
                  autoCapitalize="words"
                />

                <Button
                  variant="primary"
                  onPress={handleCreateGarden}
                  disabled={isLoading || !gardenName.trim()}
                  className="mt-2"
                >
                  <Text className="text-white font-medium">
                    {isLoading ? 'Creating Garden...' : 'Create Garden'}
                  </Text>
                </Button>
              </CardContent>
            </Card>

            {/* Info card */}
            <Card>
              <CardContent>
                <Text className="text-sm text-coal/60 text-center">
                  💡 You can manage multiple gardens and add plants after setup
                </Text>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}
