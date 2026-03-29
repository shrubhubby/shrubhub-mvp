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

export default function VolunteerRegistration() {
  const router = useRouter()

  const [plantName, setPlantName] = useState('')
  const [locationDescription, setLocationDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null)
  const [discoveredDate, setDiscoveredDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePhotoTaken = (capturedPhoto: CapturedPhoto) => {
    setPhoto(capturedPhoto)
    if (capturedPhoto.exif?.dateTaken) {
      setDiscoveredDate(capturedPhoto.exif.dateTaken.toISOString().split('T')[0])
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

      const { error } = await supabase.from('plants').insert({
        garden_id: garden.id,
        common_name: plantName.trim(),
        custom_name: plantName.trim(),
        acquired_date: discoveredDate,
        acquisition_source: 'volunteer',
        acquisition_location: null,
        acquisition_notes: [
          locationDescription && `Found in: ${locationDescription}`,
          notes,
        ].filter(Boolean).join('\n') || null,
        location_in_garden: locationDescription.trim() || null,
        status: 'vegetative',
        health_status: 'healthy',
      })

      if (error) throw error

      Alert.alert('Success!', `Added ${plantName} to your garden.`, [
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
        <Header title="Register Volunteer" showBack />

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          <View className="gap-4">
            <View>
              <Text className="text-xl font-bold text-coal">🌻 Add Volunteer Plant</Text>
              <Text className="text-sm text-coal/60 mt-1">
                Register a self-seeded plant that appeared on its own
              </Text>
            </View>

            <Card>
              <CardContent>
                <PhotoCapture
                  onPhotoTaken={handlePhotoTaken}
                  existingPhotoUri={photo?.uri}
                  label="Plant Photo (optional)"
                  helpText="Take a photo to help identify the plant later"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="gap-4">
                <Input
                  label="Plant Name *"
                  placeholder="e.g., Tomato seedling, Mystery flower"
                  value={plantName}
                  onChangeText={setPlantName}
                  autoCapitalize="words"
                />

                <Input
                  label="Where did it appear?"
                  placeholder="e.g., Near the compost bin, In the herb bed"
                  value={locationDescription}
                  onChangeText={setLocationDescription}
                />

                <Input
                  label="Date Discovered"
                  value={discoveredDate}
                  onChangeText={setDiscoveredDate}
                  placeholder="YYYY-MM-DD"
                />

                <Input
                  label="Notes (optional)"
                  placeholder="What do you think it is? Parent plant nearby?"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Text className="text-sm text-coal/60">
                  💡 Tip: Volunteer plants often come from seeds dropped by birds,
                  wind, or compost. You can update the plant name later once it's
                  easier to identify!
                </Text>
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
                  {isSubmitting ? 'Adding...' : 'Add Plant'}
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
