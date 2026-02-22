import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhotoCapture, CapturedPhoto, ExifData } from '@/components/plant/PhotoCapture'
import { supabase } from '@/lib/supabase/client'

export default function PurchaseRegistration() {
  const router = useRouter()
  const params = useLocalSearchParams<{ method?: string }>()
  const isSeedling = params.method === 'seedling_purchased'

  const [plantName, setPlantName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null)
  const [acquiredDate, setAcquiredDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePhotoTaken = (capturedPhoto: CapturedPhoto) => {
    setPhoto(capturedPhoto)

    // Auto-fill date from EXIF if available
    if (capturedPhoto.exif?.dateTaken) {
      setAcquiredDate(
        capturedPhoto.exif.dateTaken.toISOString().split('T')[0]
      )
    }
  }

  const handleSubmit = async () => {
    if (!plantName.trim()) {
      Alert.alert('Required', 'Please enter the plant name.')
      return
    }

    setIsSubmitting(true)
    try {
      // Get current user and garden
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

      // Create the plant
      const { error } = await supabase.from('plants').insert({
        garden_id: garden.id,
        common_name: plantName.trim(),
        custom_name: plantName.trim(),
        acquired_date: acquiredDate,
        acquisition_source: isSeedling ? 'seedling_purchased' : 'mature_purchased',
        acquisition_location: storeName.trim() || null,
        acquisition_notes: [
          price && `Price: ${price}`,
          notes,
        ].filter(Boolean).join('\n') || null,
        status: isSeedling ? 'seedling' : 'vegetative',
        health_status: 'healthy',
      })

      if (error) throw error

      Alert.alert('Success!', `Added ${plantName} to your garden.`, [
        {
          text: 'View Plants',
          onPress: () => router.replace('/(tabs)/plants'),
        },
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
        <Header
          title={isSeedling ? 'Register Seedling' : 'Register Purchased Plant'}
          showBack
        />

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          <View className="gap-4">
            {/* Header */}
            <View>
              <Text className="text-xl font-bold text-coal">
                {isSeedling ? '🌱 Add Purchased Seedling' : '🛒 Add Purchased Plant'}
              </Text>
              <Text className="text-sm text-coal/60 mt-1">
                Record details about your new plant
              </Text>
            </View>

            {/* Photo */}
            <Card>
              <CardContent>
                <PhotoCapture
                  onPhotoTaken={handlePhotoTaken}
                  existingPhotoUri={photo?.uri}
                  label="Plant Photo (optional)"
                  helpText="Take a photo of your new plant or its receipt"
                />
              </CardContent>
            </Card>

            {/* Plant details */}
            <Card>
              <CardContent className="gap-4">
                <Input
                  label="Plant Name *"
                  placeholder="e.g., Monstera, Fiddle Leaf Fig"
                  value={plantName}
                  onChangeText={setPlantName}
                  autoCapitalize="words"
                />

                <Input
                  label="Store/Nursery"
                  placeholder="Where did you buy it?"
                  value={storeName}
                  onChangeText={setStoreName}
                />

                <Input
                  label="Price (optional)"
                  placeholder="e.g., $29.99"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />

                <Input
                  label="Purchase Date"
                  value={acquiredDate}
                  onChangeText={setAcquiredDate}
                  placeholder="YYYY-MM-DD"
                />

                <Input
                  label="Notes (optional)"
                  placeholder="Any additional notes..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                onPress={() => router.back()}
                className="flex-1"
              >
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
