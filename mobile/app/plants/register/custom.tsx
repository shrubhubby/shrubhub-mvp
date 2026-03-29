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
import { PhotoCapture, CapturedPhoto } from '@/components/plant/PhotoCapture'
import { supabase } from '@/lib/supabase/client'

interface UserAcquisitionSource {
  id: string
  name: string
  description: string | null
}

export default function CustomRegistration() {
  const router = useRouter()
  const params = useLocalSearchParams<{ userSourceId?: string }>()

  const [source, setSource] = useState<UserAcquisitionSource | null>(null)
  const [plantName, setPlantName] = useState('')
  const [sourceDetails, setSourceDetails] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null)
  const [acquiredDate, setAcquiredDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (params.userSourceId) {
      loadSource(params.userSourceId)
    } else {
      setIsLoading(false)
    }
  }, [params.userSourceId])

  const loadSource = async (id: string) => {
    const { data, error } = await supabase
      .from('user_acquisition_sources')
      .select('id, name, description')
      .eq('id', id)
      .single()

    if (!error && data) {
      setSource(data)
    }
    setIsLoading(false)
  }

  const handlePhotoTaken = (capturedPhoto: CapturedPhoto) => {
    setPhoto(capturedPhoto)
    if (capturedPhoto.exif?.dateTaken) {
      setAcquiredDate(capturedPhoto.exif.dateTaken.toISOString().split('T')[0])
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
        acquired_date: acquiredDate,
        acquisition_source: 'user_defined',
        user_acquisition_source_id: source?.id || null,
        acquisition_location: sourceDetails.trim() || null,
        acquisition_notes: notes.trim() || null,
        status: 'vegetative',
        health_status: 'healthy',
      })

      if (error) throw error

      // Increment usage count for the source
      if (source?.id) {
        await supabase.rpc('increment_acquisition_source_usage', {
          source_id: source.id,
        })
      }

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

  if (isLoading) {
    return (
      <View className="flex-1 bg-soft items-center justify-center">
        <Text className="text-coal/60">Loading...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-soft">
        <Header title={source?.name || 'Custom Source'} showBack />

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          <View className="gap-4">
            <View>
              <Text className="text-xl font-bold text-coal">
                {source?.name || 'Custom Acquisition'}
              </Text>
              {source?.description && (
                <Text className="text-sm text-coal/60 mt-1">
                  {source.description}
                </Text>
              )}
            </View>

            <Card>
              <CardContent>
                <PhotoCapture
                  onPhotoTaken={handlePhotoTaken}
                  existingPhotoUri={photo?.uri}
                  label="Plant Photo (optional)"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="gap-4">
                <Input
                  label="Plant Name *"
                  placeholder="e.g., Monstera, Pothos"
                  value={plantName}
                  onChangeText={setPlantName}
                  autoCapitalize="words"
                />

                <Input
                  label="Source Details"
                  placeholder="Where/how did you get it?"
                  value={sourceDetails}
                  onChangeText={setSourceDetails}
                />

                <Input
                  label="Date Acquired"
                  value={acquiredDate}
                  onChangeText={setAcquiredDate}
                  placeholder="YYYY-MM-DD"
                />

                <Input
                  label="Notes (optional)"
                  placeholder="Any additional details..."
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
