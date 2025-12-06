import React, { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

export default function AddPlantScreen() {
  const router = useRouter()
  const [customName, setCustomName] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAddPlant = async () => {
    if (!customName.trim()) {
      alert('Please enter a plant name')
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

      // Get gardener
      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      // Get garden
      const { data: garden } = await supabase
        .from('gardens')
        .select('id')
        .eq('gardener_id', gardener?.id)
        .single()

      if (!garden) {
        alert('No garden found. Please create a garden first.')
        return
      }

      // Add plant
      const { error } = await supabase
        .from('plants')
        .insert({
          garden_id: garden.id,
          common_name: customName.trim(),
          custom_name: customName.trim(),
          notes: notes.trim() || null,
          health_status: 'healthy',
          acquired_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
          created_at: new Date().toISOString(),
        })

      if (error) throw error

      // Navigate back
      router.back()
    } catch (error) {
      console.error('Error adding plant:', error)
      alert('Failed to add plant. Please try again.')
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
        <Header showBack title="Add Plant" />

        <ScrollView className="flex-1" contentContainerClassName="pb-20">
          <View className="px-4 py-6 gap-6 max-w-4xl">
            <View>
              <Text className="text-3xl font-bold text-coal">Add New Plant</Text>
              <Text className="text-coal/60 mt-1">
                Add a new plant to your garden
              </Text>
            </View>

            <Card>
              <CardContent className="gap-4">
                <Input
                  label="Plant Name *"
                  placeholder="e.g., Monstera, Pothos, Fiddle Leaf Fig"
                  value={customName}
                  onChangeText={setCustomName}
                  autoCapitalize="words"
                />

                <Input
                  label="Notes (Optional)"
                  placeholder="Location, care instructions, etc."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

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
                    onPress={handleAddPlant}
                    disabled={isLoading || !customName.trim()}
                    className="flex-1"
                  >
                    <Text className="text-white font-medium">
                      {isLoading ? 'Adding...' : 'Add Plant'}
                    </Text>
                  </Button>
                </View>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Text className="text-sm text-coal/60">
                  💡 Tip: You can add more details like photos, watering schedule, and plant species after creating the plant.
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
