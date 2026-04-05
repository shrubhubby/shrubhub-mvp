import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import * as FileSystem from 'expo-file-system'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PlantLocationMiniMap } from '@/components/map/PlantLocationMiniMap'
import { supabase } from '@/lib/supabase/client'

// --- Types ---

interface ExifData {
  dateTaken?: Date
  latitude?: number
  longitude?: number
  locationName?: string
}

interface IdentificationSuggestion {
  species: string
  common_name: string
  confidence: number
}

interface IdentificationResult {
  species?: string
  common_name?: string
  confidence: number
  suggestions: IdentificationSuggestion[]
  health_assessment?: object
}

interface CapturedPlant {
  id: string
  uri: string
  exif: ExifData
  identification: IdentificationResult | null
  identificationStatus: 'pending' | 'loading' | 'done' | 'error'
  plantName: string
  notes: string
}

// --- Helpers ---

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function parseExifDate(exifDateTime: string | undefined): Date | undefined {
  if (!exifDateTime) return undefined
  try {
    const [datePart, timePart] = exifDateTime.split(' ')
    const [year, month, day] = datePart.split(':').map(Number)
    const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0, 0, 0]
    return new Date(year, month - 1, day, hour, minute, second)
  } catch {
    return undefined
  }
}

function extractExif(asset: ImagePicker.ImagePickerAsset): ExifData {
  const exif: ExifData = {}
  if (asset.exif) {
    const dateTimeOriginal = asset.exif.DateTimeOriginal || asset.exif.DateTime
    if (dateTimeOriginal) {
      exif.dateTaken = parseExifDate(dateTimeOriginal as string)
    }
    const lat = asset.exif.GPSLatitude
    const lng = asset.exif.GPSLongitude
    const latRef = asset.exif.GPSLatitudeRef
    const lngRef = asset.exif.GPSLongitudeRef
    if (lat !== undefined && lng !== undefined) {
      exif.latitude = latRef === 'S' ? -lat : lat
      exif.longitude = lngRef === 'W' ? -lng : lng
    }
  }
  return exif
}

function formatDateTime(date: Date | undefined): string {
  if (!date) return 'Unknown'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function confidenceLabel(c: number): { text: string; color: string } {
  if (c >= 0.8) return { text: 'High', color: 'bg-forest' }
  if (c >= 0.5) return { text: 'Medium', color: 'bg-amber-500' }
  return { text: 'Low', color: 'bg-urgent' }
}

// --- Main Component ---

export default function InventoryWalkthrough() {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0=capture, 1=review
  const [captures, setCaptures] = useState<CapturedPlant[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gardenerId, setGardenerId] = useState<string>()
  const [gardenId, setGardenId] = useState<string>()

  useEffect(() => {
    loadGardenerAndGarden()
  }, [])

  const loadGardenerAndGarden = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { data: gardener } = await supabase
      .from('gardeners')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (gardener) {
      setGardenerId(gardener.id)
      const { data: garden } = await supabase
        .from('gardens')
        .select('id')
        .eq('gardener_id', gardener.id)
        .single()
      if (garden) setGardenId(garden.id)
    }
  }

  // --- Photo Capture ---

  const capturePhoto = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed.')
          return
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library access is needed.')
          return
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, exif: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, exif: true })

      if (result.canceled || !result.assets[0]) return

      const asset = result.assets[0]
      const exif = extractExif(asset)

      // Fallback GPS from device if camera and no EXIF GPS
      if (!exif.latitude && useCamera) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync()
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
            exif.latitude = loc.coords.latitude
            exif.longitude = loc.coords.longitude
          }
        } catch {}
      }

      // Fallback date
      if (!exif.dateTaken && useCamera) {
        exif.dateTaken = new Date()
      }

      // Reverse geocode
      if (exif.latitude && exif.longitude) {
        try {
          const [address] = await Location.reverseGeocodeAsync({
            latitude: exif.latitude,
            longitude: exif.longitude,
          })
          if (address) {
            const parts = [address.city, address.region, address.country].filter(Boolean)
            exif.locationName = parts.join(', ')
          }
        } catch {}
      }

      const newCapture: CapturedPlant = {
        id: generateId(),
        uri: asset.uri,
        exif,
        identification: null,
        identificationStatus: 'pending',
        plantName: '',
        notes: '',
      }

      setCaptures(prev => [...prev, newCapture])

      // Fire identification async
      identifyPlant(asset.uri, newCapture.id)
    } catch (error) {
      console.error('Error capturing photo:', error)
      Alert.alert('Error', 'Failed to capture photo.')
    }
  }

  // --- Plant Identification ---

  const identifyPlant = async (photoUri: string, captureId: string) => {
    setCaptures(prev =>
      prev.map(c => c.id === captureId ? { ...c, identificationStatus: 'loading' } : c)
    )

    try {
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/identify-plant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ image: base64 }),
        }
      )

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const result: IdentificationResult = await response.json()

      setCaptures(prev =>
        prev.map(c => {
          if (c.id !== captureId) return c
          return {
            ...c,
            identification: result,
            identificationStatus: 'done',
            // Auto-fill name from primary result if not already set
            plantName: c.plantName || result.common_name || result.species || '',
          }
        })
      )
    } catch (error) {
      console.error('Identification error:', error)
      setCaptures(prev =>
        prev.map(c => c.id === captureId ? { ...c, identificationStatus: 'error' } : c)
      )
    }
  }

  // --- Update capture fields ---

  const updateCapture = useCallback((id: string, updates: Partial<CapturedPlant>) => {
    setCaptures(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const removeCapture = useCallback((id: string) => {
    setCaptures(prev => prev.filter(c => c.id !== id))
  }, [])

  // --- Submit ---

  const handleSubmit = async () => {
    const unnamed = captures.filter(c => !c.plantName.trim())
    if (unnamed.length > 0) {
      Alert.alert('Missing Names', `${unnamed.length} plant(s) still need a name. Please fill in all plant names before saving.`)
      return
    }

    if (!gardenerId || !gardenId) {
      Alert.alert('No Garden', 'Please create a garden first.')
      return
    }

    setIsSubmitting(true)
    try {
      // Create batch
      const { data: batch, error: batchError } = await supabase
        .from('plant_registration_batches')
        .insert({
          gardener_id: gardenerId,
          garden_id: gardenId,
          batch_type: 'inventory',
          total_count: captures.length,
          photo_method: 'individual',
          metadata: {
            capture_count: captures.length,
            identified_count: captures.filter(c => c.identificationStatus === 'done').length,
          },
        })
        .select()
        .single()

      if (batchError) throw batchError

      // Batch insert plants
      const plantsToInsert = captures.map(c => ({
        garden_id: gardenId,
        common_name: c.plantName.trim(),
        custom_name: c.plantName.trim(),
        acquired_date: c.exif.dateTaken
          ? c.exif.dateTaken.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        planted_date: c.exif.dateTaken
          ? c.exif.dateTaken.toISOString().split('T')[0]
          : null,
        acquisition_source: 'unknown',
        acquisition_notes: c.notes.trim() || null,
        status: 'vegetative',
        health_status: 'healthy',
        location_lat: c.exif.latitude || null,
        location_lng: c.exif.longitude || null,
        registration_batch_id: batch.id,
      }))

      const { error: plantsError } = await supabase
        .from('plants')
        .insert(plantsToInsert)

      if (plantsError) throw plantsError

      Alert.alert(
        'Inventory Complete!',
        `Added ${captures.length} plant${captures.length !== 1 ? 's' : ''} to your garden.`,
        [{ text: 'View Plants', onPress: () => router.replace('/(tabs)/plants') }]
      )
    } catch (error) {
      console.error('Error saving inventory:', error)
      Alert.alert('Error', 'Failed to save plants. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Render: Capture Mode ---

  const renderCaptureMode = () => (
    <View className="flex-1">
      {/* Captured thumbnails */}
      {captures.length > 0 ? (
        <View className="border-b border-soft bg-white">
          <FlatList
            data={captures}
            horizontal
            keyExtractor={c => c.id}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="relative">
                <Image
                  source={{ uri: item.uri }}
                  className="w-20 h-20 rounded-lg"
                  resizeMode="cover"
                />
                {item.exif.latitude && (
                  <View className="absolute bottom-1 left-1 bg-forest/80 px-1 rounded">
                    <Text className="text-white text-[8px]">GPS</Text>
                  </View>
                )}
                {item.identificationStatus === 'loading' && (
                  <View className="absolute top-1 right-1">
                    <ActivityIndicator size="small" color="#228B1B" />
                  </View>
                )}
                {item.identificationStatus === 'done' && (
                  <View className="absolute top-1 right-1 bg-forest w-4 h-4 rounded-full items-center justify-center">
                    <Text className="text-white text-[10px]">✓</Text>
                  </View>
                )}
                <Pressable
                  onPress={() => removeCapture(item.id)}
                  className="absolute top-1 left-1 w-5 h-5 bg-coal/60 rounded-full items-center justify-center"
                >
                  <Text className="text-white text-xs">×</Text>
                </Pressable>
              </View>
            )}
          />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-6xl mb-4">📋</Text>
          <Text className="text-xl font-bold text-coal text-center">
            Garden Inventory
          </Text>
          <Text className="text-sm text-coal/60 text-center mt-2">
            Walk around your garden and take a photo of each plant.
            We'll identify them and map their locations.
          </Text>
        </View>
      )}

      {captures.length > 0 && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-4xl mb-2">📷</Text>
          <Text className="text-coal/60">
            {captures.length} plant{captures.length !== 1 ? 's' : ''} captured
          </Text>
          <Text className="text-xs text-coal/40 mt-1">
            Keep going, or tap "Done" to review
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View className="p-4 border-t border-soft bg-white gap-3">
        {captures.length > 0 && (
          <Button variant="primary" onPress={() => setStep(1)}>
            <Text className="text-white font-medium">
              Done Capturing — Review {captures.length} Plant{captures.length !== 1 ? 's' : ''}
            </Text>
          </Button>
        )}

        <View className="flex-row gap-3">
          <Button
            variant={captures.length > 0 ? 'outline' : 'primary'}
            onPress={() => capturePhoto(true)}
            className="flex-1"
          >
            <Text className={captures.length > 0 ? 'text-coal font-medium' : 'text-white font-medium'}>
              📷 Take Photo
            </Text>
          </Button>
          <Button
            variant="outline"
            onPress={() => capturePhoto(false)}
            className="flex-1"
          >
            <Text className="text-coal font-medium">From Library</Text>
          </Button>
        </View>
      </View>
    </View>
  )

  // --- Render: Review Mode ---

  const renderReviewMode = () => (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
      >
        <View className="gap-6">
          <View>
            <Text className="text-xl font-bold text-coal">
              Review {captures.length} Plant{captures.length !== 1 ? 's' : ''}
            </Text>
            <Text className="text-sm text-coal/60 mt-1">
              Confirm names and fill in any missing details
            </Text>
          </View>

          {captures.map((capture, index) => (
            <PlantReviewCard
              key={capture.id}
              capture={capture}
              index={index}
              onUpdate={updateCapture}
              onRemove={removeCapture}
              onRetryIdentify={() => identifyPlant(capture.uri, capture.id)}
            />
          ))}

          {/* Action buttons at end of scroll */}
          <View className="flex-row gap-3">
            <Button variant="outline" onPress={() => setStep(0)} className="flex-1">
              <Text className="text-coal font-medium">+ Capture More</Text>
            </Button>
            <Button
              variant="primary"
              onPress={handleSubmit}
              disabled={isSubmitting || captures.length === 0}
              className="flex-1"
            >
              <Text className="text-white font-medium">
                {isSubmitting ? 'Saving...' : `Save All (${captures.length})`}
              </Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-soft">
        <Header
          title={step === 0 ? 'Garden Inventory' : 'Review Plants'}
          showBack
          onBack={() => {
            if (step === 1) {
              setStep(0)
            } else if (captures.length > 0) {
              Alert.alert(
                'Discard Inventory?',
                `You have ${captures.length} plant(s) captured. Discard them?`,
                [
                  { text: 'Keep Going', style: 'cancel' },
                  { text: 'Discard', style: 'destructive', onPress: () => router.back() },
                ]
              )
            } else {
              router.back()
            }
          }}
        />
        {step === 0 ? renderCaptureMode() : renderReviewMode()}
        <BottomNav />
      </View>
    </KeyboardAvoidingView>
  )
}

// --- Plant Review Card ---

interface PlantReviewCardProps {
  capture: CapturedPlant
  index: number
  onUpdate: (id: string, updates: Partial<CapturedPlant>) => void
  onRemove: (id: string) => void
  onRetryIdentify: () => void
}

function PlantReviewCard({
  capture,
  index,
  onUpdate,
  onRemove,
  onRetryIdentify,
}: PlantReviewCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false)
  const { identification, identificationStatus, exif } = capture

  const selectSuggestion = (suggestion: IdentificationSuggestion) => {
    onUpdate(capture.id, { plantName: suggestion.common_name || suggestion.species })
    setShowAlternatives(false)
  }

  return (
    <Card>
      <CardContent className="gap-3 p-0">
        {/* Photo */}
        <Image
          source={{ uri: capture.uri }}
          className="w-full rounded-t-lg"
          style={{ height: 160 }}
          resizeMode="cover"
        />

        {/* Mini map */}
        {exif.latitude && exif.longitude ? (
          <View className="px-3">
            <PlantLocationMiniMap
              latitude={exif.latitude}
              longitude={exif.longitude}
              locationName={exif.locationName}
            />
          </View>
        ) : (
          <View className="px-3">
            <View className="bg-soft rounded-lg h-12 items-center justify-center">
              <Text className="text-xs text-coal/40">No GPS location available</Text>
            </View>
          </View>
        )}

        {/* EXIF metadata */}
        {(exif.dateTaken || exif.locationName) && (
          <View className="px-3 flex-row flex-wrap gap-x-4 gap-y-1">
            {exif.dateTaken && (
              <Text className="text-xs text-coal/50">
                {formatDateTime(exif.dateTaken)}
              </Text>
            )}
            {exif.locationName && (
              <Text className="text-xs text-coal/50">
                {exif.locationName}
              </Text>
            )}
          </View>
        )}

        {/* Identification results */}
        <View className="px-3">
          {identificationStatus === 'loading' && (
            <View className="flex-row items-center gap-2 py-2">
              <ActivityIndicator size="small" color="#228B1B" />
              <Text className="text-sm text-coal/60">Identifying plant...</Text>
            </View>
          )}

          {identificationStatus === 'done' && identification && (
            <View className="gap-2">
              {/* Primary result */}
              <View className="flex-row items-center gap-2">
                <View className={`px-2 py-0.5 rounded ${confidenceLabel(identification.confidence).color}`}>
                  <Text className="text-white text-[10px] font-medium">
                    {confidenceLabel(identification.confidence).text}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-coal flex-1" numberOfLines={1}>
                  {identification.common_name || identification.species || 'Unknown'}
                </Text>
                {identification.common_name && capture.plantName !== identification.common_name && (
                  <Pressable
                    onPress={() => onUpdate(capture.id, { plantName: identification.common_name! })}
                    className="bg-forest/10 px-2 py-1 rounded"
                  >
                    <Text className="text-forest text-xs font-medium">Use</Text>
                  </Pressable>
                )}
              </View>

              {identification.species && (
                <Text className="text-xs text-coal/50 italic">{identification.species}</Text>
              )}

              {/* Alternative suggestions - collapsed */}
              {identification.suggestions && identification.suggestions.length > 0 && (
                <View>
                  <Pressable
                    onPress={() => setShowAlternatives(!showAlternatives)}
                    className="flex-row items-center gap-1 py-1"
                  >
                    <Text className="text-xs text-coal/40">
                      {showAlternatives ? '▼' : '▶'} {identification.suggestions.length} other suggestion{identification.suggestions.length !== 1 ? 's' : ''}
                    </Text>
                  </Pressable>

                  {showAlternatives && (
                    <View className="gap-1 ml-2">
                      {identification.suggestions.map((s, i) => (
                        <Pressable
                          key={i}
                          onPress={() => selectSuggestion(s)}
                          className="flex-row items-center justify-between py-1.5 px-2 bg-soft rounded"
                        >
                          <View className="flex-1 mr-2">
                            <Text className="text-xs text-coal" numberOfLines={1}>
                              {s.common_name || s.species}
                            </Text>
                            {s.species && s.common_name && (
                              <Text className="text-[10px] text-coal/40 italic">{s.species}</Text>
                            )}
                          </View>
                          <Text className="text-[10px] text-coal/40">
                            {Math.round(s.confidence * 100)}%
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {identificationStatus === 'error' && (
            <View className="flex-row items-center gap-2 py-2">
              <Text className="text-xs text-coal/50 flex-1">Could not identify plant</Text>
              <Pressable onPress={onRetryIdentify} className="bg-soft px-2 py-1 rounded">
                <Text className="text-xs text-forest font-medium">Retry</Text>
              </Pressable>
            </View>
          )}

          {identificationStatus === 'pending' && (
            <View className="py-2">
              <Text className="text-xs text-coal/40">Waiting to identify...</Text>
            </View>
          )}
        </View>

        {/* Editable fields */}
        <View className="px-3 gap-3">
          <Input
            label={`Plant Name *`}
            placeholder="e.g., Tomato, Rose, Lavender"
            value={capture.plantName}
            onChangeText={(text) => onUpdate(capture.id, { plantName: text })}
            autoCapitalize="words"
          />
          <Input
            label="Notes (optional)"
            placeholder="Location details, condition, etc."
            value={capture.notes}
            onChangeText={(text) => onUpdate(capture.id, { notes: text })}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Remove button */}
        <View className="px-3 pb-3">
          <Pressable
            onPress={() => {
              Alert.alert('Remove Plant', 'Remove this plant from the inventory?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => onRemove(capture.id) },
              ])
            }}
            className="py-2"
          >
            <Text className="text-xs text-urgent text-center">Remove from inventory</Text>
          </Pressable>
        </View>
      </CardContent>
    </Card>
  )
}
