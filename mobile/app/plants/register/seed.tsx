import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhotoCapture, CapturedPhoto } from '@/components/plant/PhotoCapture'
import { supabase } from '@/lib/supabase/client'

export default function SeedRegistration() {
  const router = useRouter()

  const [plantName, setPlantName] = useState('')
  const [seedSource, setSeedSource] = useState('')
  const [variety, setVariety] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null)
  const [plantedDate, setPlantedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePhotoTaken = (capturedPhoto: CapturedPhoto) => {
    setPhoto(capturedPhoto)
    if (capturedPhoto.exif?.dateTaken) {
      setPlantedDate(capturedPhoto.exif.dateTaken.toISOString().split('T')[0])
    }
  }

  const handleSubmit = async () => {
    if (!plantName.trim()) {
      Alert.alert('Required', 'Please enter the plant name.')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      const { data: garden } = await supabase
        .from('gardens')
        .select('id')
        .eq('gardener_id', gardener?.id)
        .single()

      if (!garden) {
        Alert.alert('No Garden', 'Please create a garden first.')
        return
      }

      const fullName = variety ? `${plantName} (${variety})` : plantName

      const { error } = await supabase.from('plants').insert({
        garden_id: garden.id,
        common_name: fullName.trim(),
        custom_name: fullName.trim(),
        acquired_date: plantedDate,
        planted_date: plantedDate,
        acquisition_source: 'seed',
        acquisition_location: seedSource.trim() || null,
        acquisition_notes: notes.trim() || null,
        status: 'seed',
        health_status: 'healthy',
      })

      if (error) throw error

      Alert.alert('Success!', `Added ${fullName} seeds to your garden.`, [
        { text: 'View Plants', onPress: () => router.replace('/(tabs)/plants') },
      ])
    } catch (error) {
      console.error('Error adding plant:', error)
      Alert.alert('Error', 'Failed to add plant. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-soft">
        <Header title="Register Seeds" showBack />

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          <View className="gap-4">
            <View>
              <Text className="text-xl font-bold text-coal">🫘 Start from Seed</Text>
              <Text className="text-sm text-coal/60 mt-1">
                Track a plant you're growing from seed
              </Text>
            </View>

            <Card>
              <CardContent>
                <PhotoCapture
                  onPhotoTaken={handlePhotoTaken}
                  existingPhotoUri={photo?.uri}
                  label="Photo (optional)"
                  helpText="Photo of seed packet or planting area"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="gap-4">
                <Input
                  label="Plant Name *"
                  placeholder="e.g., Tomato, Basil, Sunflower"
                  value={plantName}
                  onChangeText={setPlantName}
                  autoCapitalize="words"
                />

                <Input
                  label="Variety (optional)"
                  placeholder="e.g., Roma, Beefsteak, Cherry"
                  value={variety}
                  onChangeText={setVariety}
                />

                <Input
                  label="Seed Source"
                  placeholder="e.g., Burpee, saved seeds, seed swap"
                  value={seedSource}
                  onChangeText={setSeedSource}
                />

                <Input
                  label="Date Planted"
                  value={plantedDate}
                  onChangeText={setPlantedDate}
                  placeholder="YYYY-MM-DD"
                />

                <Input
                  label="Notes (optional)"
                  placeholder="Planting method, soil mix, etc."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </CardContent>
            </Card>

            <View className="flex-row gap-3">
              <Button variant="outline" onPress={() => router.back()} className="flex-1">
                <Text className="text-coal font-medium">Cancel</Text>
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmit}
                disabled={isSubmitting || !plantName.trim()}
                className="flex-1"
              >
                <Text className="text-white font-medium">
                  {isSubmitting ? 'Adding...' : 'Add Seeds'}
                </Text>
              </Button>
            </View>
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </KeyboardAvoidingView>
  )
}
