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
import { PhotoCapture, CapturedPhoto, ExifData } from '@/components/plant/PhotoCapture'
import { supabase } from '@/lib/supabase/client'

export default function FieldExtractionRegistration() {
  const router = useRouter()

  const [plantName, setPlantName] = useState('')
  const [locationDescription, setLocationDescription] = useState('')
  const [habitat, setHabitat] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null)
  const [exifData, setExifData] = useState<ExifData | null>(null)
  const [extractionDate, setExtractionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePhotoTaken = (capturedPhoto: CapturedPhoto) => {
    setPhoto(capturedPhoto)

    if (capturedPhoto.exif) {
      setExifData(capturedPhoto.exif)

      // Auto-fill from EXIF
      if (capturedPhoto.exif.dateTaken) {
        setExtractionDate(capturedPhoto.exif.dateTaken.toISOString().split('T')[0])
      }
      if (capturedPhoto.exif.latitude) {
        setLatitude(capturedPhoto.exif.latitude.toFixed(6))
      }
      if (capturedPhoto.exif.longitude) {
        setLongitude(capturedPhoto.exif.longitude.toFixed(6))
      }
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

      // Build field extraction data JSON
      const fieldExtractionData = {
        location_description: locationDescription,
        habitat,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        photo_exif: exifData || null,
      }

      const { error } = await supabase.from('plants').insert({
        garden_id: garden.id,
        common_name: plantName.trim(),
        custom_name: plantName.trim(),
        acquired_date: extractionDate,
        acquisition_source: 'field_extraction',
        acquisition_location: locationDescription.trim() || null,
        acquisition_notes: notes.trim() || null,
        location_lat: latitude ? parseFloat(latitude) : null,
        location_lng: longitude ? parseFloat(longitude) : null,
        field_extraction_data: fieldExtractionData,
        status: 'vegetative',
        health_status: 'healthy',
      })

      if (error) throw error

      Alert.alert('Success!', `Added ${plantName} from field extraction.`, [
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
        <Header title="Field Extraction" showBack />

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          <View className="gap-4">
            <View>
              <Text className="text-xl font-bold text-coal">🌿 Field Extraction</Text>
              <Text className="text-sm text-coal/60 mt-1">
                Register a plant collected from the wild
              </Text>
            </View>

            <Card>
              <CardContent>
                <PhotoCapture
                  onPhotoTaken={handlePhotoTaken}
                  existingPhotoUri={photo?.uri}
                  label="Photo *"
                  helpText="Photo helps record location and date via GPS/EXIF"
                />

                {exifData && (exifData.latitude || exifData.dateTaken) && (
                  <View className="mt-3 p-3 bg-forest/10 rounded-lg">
                    <Text className="text-xs font-medium text-forest mb-1">
                      Auto-detected from photo:
                    </Text>
                    {exifData.dateTaken && (
                      <Text className="text-xs text-coal/70">
                        📅 {exifData.dateTaken.toLocaleDateString()}
                      </Text>
                    )}
                    {exifData.latitude && exifData.longitude && (
                      <Text className="text-xs text-coal/70">
                        📍 {exifData.latitude.toFixed(4)}, {exifData.longitude.toFixed(4)}
                      </Text>
                    )}
                  </View>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="gap-4">
                <Input
                  label="Plant Name *"
                  placeholder="e.g., Wild Violet, Native Fern"
                  value={plantName}
                  onChangeText={setPlantName}
                  autoCapitalize="words"
                />

                <Input
                  label="Location Description"
                  placeholder="e.g., Riverside trail near Oak Creek"
                  value={locationDescription}
                  onChangeText={setLocationDescription}
                />

                <Input
                  label="Habitat"
                  placeholder="e.g., Shaded woodland, wet meadow"
                  value={habitat}
                  onChangeText={setHabitat}
                />

                <Input
                  label="Extraction Date"
                  value={extractionDate}
                  onChangeText={setExtractionDate}
                  placeholder="YYYY-MM-DD"
                />

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Input
                      label="Latitude"
                      value={latitude}
                      onChangeText={setLatitude}
                      placeholder="e.g., 37.7749"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="Longitude"
                      value={longitude}
                      onChangeText={setLongitude}
                      placeholder="e.g., -122.4194"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <Input
                  label="Notes"
                  placeholder="Environmental conditions, permits, etc."
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
                  ⚠️ Please ensure you have permission to collect plants from the
                  location and that extraction is legal and ethical.
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
