import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhotoCapture, CapturedPhoto, ExifData } from '@/components/plant/PhotoCapture'
import { MotherPlantSelector } from '@/components/plant/MotherPlantSelector'
import { QRCodeScanner } from '@/components/plant/QRCodeScanner'
import { supabase } from '@/lib/supabase/client'

interface MotherPlant {
  id: string
  common_name: string
  custom_name: string | null
  garden_id: string
  plants_master?: {
    scientific_name: string
  } | null
}

const WIZARD_STEPS = [
  { key: 'photo', title: 'Seed Photo' },
  { key: 'mother', title: 'Mother Plant' },
  { key: 'qr', title: 'Plant ID' },
  { key: 'confirm', title: 'Review & Save' },
]

export default function SeedRegistration() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  // Auth
  const [gardenerId, setGardenerId] = useState<string | undefined>()
  const [gardenId, setGardenId] = useState<string | undefined>()

  // Step 1: Seed photo
  const [seedPhoto, setSeedPhoto] = useState<CapturedPhoto | null>(null)
  const [exifData, setExifData] = useState<ExifData | null>(null)

  // Step 2: Mother plant
  const [motherPlant, setMotherPlant] = useState<MotherPlant | null>(null)

  // Step 3: QR / plant ID
  const [editableId, setEditableId] = useState('')

  // Step 4: Details
  const [plantName, setPlantName] = useState('')
  const [variety, setVariety] = useState('')
  const [seedSource, setSeedSource] = useState('')
  const [notes, setNotes] = useState('')
  const [plantedDate, setPlantedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadGardenerAndGarden()
  }, [])

  const loadGardenerAndGarden = async () => {
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

    if (gardener) {
      setGardenerId(gardener.id)

      const { data: garden } = await supabase
        .from('gardens')
        .select('id')
        .eq('gardener_id', gardener.id)
        .single()

      if (garden) {
        setGardenId(garden.id)
      }
    }
  }

  const handlePhotoTaken = (photo: CapturedPhoto) => {
    setSeedPhoto(photo)
    if (photo.exif) {
      setExifData(photo.exif)
      if (photo.exif.dateTaken) {
        setPlantedDate(photo.exif.dateTaken.toISOString().split('T')[0])
      }
    }
  }

  const handleMotherSelect = (plant: MotherPlant) => {
    setMotherPlant(plant)
    // Auto-populate plant name from mother
    if (!plantName) {
      setPlantName(plant.custom_name || plant.common_name)
    }
  }

  const handleQRScanned = (data: string) => {
    setEditableId(data)
  }

  const formatDateTime = (date: Date | undefined) => {
    if (!date) return 'Not available'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSubmit = async () => {
    if (!plantName.trim()) {
      Alert.alert('Required', 'Please enter the plant name.')
      return
    }

    if (!gardenId) {
      Alert.alert('No Garden', 'Please create a garden first.')
      return
    }

    setIsSubmitting(true)
    try {
      const fullName = variety ? `${plantName} (${variety})` : plantName

      const { error } = await supabase.from('plants').insert({
        garden_id: gardenId,
        common_name: fullName.trim(),
        custom_name: fullName.trim(),
        acquired_date: plantedDate,
        planted_date: plantedDate,
        acquisition_source: 'seed',
        acquisition_location: seedSource.trim() || null,
        acquisition_notes: notes.trim() || null,
        status: 'seed',
        health_status: 'healthy',
        parent_plant_id: motherPlant?.id || null,
        editable_id: editableId.trim() || null,
        location_lat: exifData?.latitude || null,
        location_lng: exifData?.longitude || null,
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

  const goBack = () => {
    if (step === 0) {
      router.back()
    } else {
      setStep(step - 1)
    }
  }

  const goNext = () => {
    setStep(step + 1)
  }

  const renderStepIndicator = () => (
    <View className="flex-row items-center justify-center py-3 gap-2">
      {WIZARD_STEPS.map((s, i) => (
        <View
          key={s.key}
          className={`h-2 rounded-full ${
            i === step
              ? 'w-6 bg-forest'
              : i < step
              ? 'w-2 bg-forest/50'
              : 'w-2 bg-soft'
          }`}
        />
      ))}
    </View>
  )

  const renderStep = () => {
    switch (step) {
      // Step 1: Seed Photo
      case 0:
        return (
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            <View className="gap-4">
              <View>
                <Text className="text-xl font-bold text-coal">Seed Photo</Text>
                <Text className="text-sm text-coal/60 mt-1">
                  Take or select a photo of the seed(s) or seed pod
                </Text>
              </View>

              <Card>
                <CardContent>
                  <PhotoCapture
                    onPhotoTaken={handlePhotoTaken}
                    existingPhotoUri={seedPhoto?.uri}
                    label="Photo of seeds / seed pod"
                    helpText="EXIF date and location will be extracted automatically"
                  />
                </CardContent>
              </Card>

              {/* Planting metadata from EXIF */}
              {exifData && (exifData.dateTaken || exifData.locationName || exifData.latitude) && (
                <Card>
                  <CardContent className="gap-2">
                    <Text className="text-sm font-medium text-coal">Planting Details (from photo)</Text>
                    {exifData.dateTaken && (
                      <View className="flex-row items-center gap-2">
                        <Text className="text-coal/40 text-sm">Date/Time:</Text>
                        <Text className="text-coal text-sm font-medium">
                          {formatDateTime(exifData.dateTaken)}
                        </Text>
                      </View>
                    )}
                    {(exifData.locationName || exifData.latitude) && (
                      <View className="flex-row items-center gap-2">
                        <Text className="text-coal/40 text-sm">Location:</Text>
                        <Text className="text-coal text-sm font-medium">
                          {exifData.locationName || `${exifData.latitude!.toFixed(4)}, ${exifData.longitude!.toFixed(4)}`}
                        </Text>
                      </View>
                    )}
                  </CardContent>
                </Card>
              )}

              <View className="flex-row gap-3">
                <Button variant="outline" onPress={goBack} className="flex-1">
                  <Text className="text-coal font-medium">Cancel</Text>
                </Button>
                <Button variant="primary" onPress={goNext} className="flex-1">
                  <Text className="text-white font-medium">
                    {seedPhoto ? 'Continue' : 'Skip Photo'}
                  </Text>
                </Button>
              </View>
            </View>
          </ScrollView>
        )

      // Step 2: Mother Plant
      case 1:
        return (
          <View className="flex-1">
            <View className="px-4 py-2">
              <Text className="text-lg font-bold text-coal">
                Mother Plant (Optional)
              </Text>
              <Text className="text-sm text-coal/60">
                Select the plant these seeds came from, or skip if unknown
              </Text>
            </View>

            {motherPlant && (
              <View className="px-4 pb-2">
                <Card className="border-2 border-forest">
                  <CardContent className="flex-row items-center gap-3">
                    <Text className="text-3xl">🌿</Text>
                    <View className="flex-1">
                      <Text className="font-semibold text-coal">
                        Selected: {motherPlant.custom_name || motherPlant.common_name}
                      </Text>
                      {motherPlant.plants_master?.scientific_name && (
                        <Text className="text-sm text-coal/60 italic">
                          {motherPlant.plants_master.scientific_name}
                        </Text>
                      )}
                    </View>
                  </CardContent>
                </Card>
              </View>
            )}

            {gardenerId && (
              <MotherPlantSelector
                gardenerId={gardenerId}
                onSelect={handleMotherSelect}
                selectedPlantId={motherPlant?.id}
              />
            )}

            <View className="p-4 border-t border-soft bg-white flex-row gap-3">
              <Button variant="outline" onPress={goNext} className="flex-1">
                <Text className="text-coal font-medium">
                  {motherPlant ? 'Continue' : 'Skip'}
                </Text>
              </Button>
              {motherPlant && (
                <Button variant="primary" onPress={goNext} className="flex-1">
                  <Text className="text-white font-medium">Continue</Text>
                </Button>
              )}
            </View>
          </View>
        )

      // Step 3: QR Code / Plant ID
      case 2:
        return (
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            <View className="gap-4">
              <View>
                <Text className="text-xl font-bold text-coal">Plant ID</Text>
                <Text className="text-sm text-coal/60 mt-1">
                  Scan the QR code label to assign an ID to this plant
                </Text>
              </View>

              {editableId ? (
                <Card className="border-2 border-forest">
                  <CardContent className="gap-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">🔗</Text>
                      <View className="flex-1">
                        <Text className="text-xs font-medium text-coal/60">Plant ID</Text>
                        <Text className="text-lg font-bold text-coal">{editableId}</Text>
                      </View>
                    </View>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => setEditableId('')}
                    >
                      <Text className="text-coal">Scan Again</Text>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <View className="gap-3">
                  <QRCodeScanner
                    onScan={handleQRScanned}
                    buttonLabel="Scan QR Code"
                    scannerTitle="Point camera at the plant's QR code label"
                  />

                  <View className="flex-row items-center gap-3 py-2">
                    <View className="flex-1 h-px bg-coal/20" />
                    <Text className="text-coal/40 text-sm">or enter manually</Text>
                    <View className="flex-1 h-px bg-coal/20" />
                  </View>

                  <Input
                    label="Plant ID"
                    placeholder="Enter the ID from the label"
                    value={editableId}
                    onChangeText={setEditableId}
                    autoCapitalize="none"
                  />
                </View>
              )}

              <View className="flex-row gap-3 mt-4">
                <Button variant="outline" onPress={goNext} className="flex-1">
                  <Text className="text-coal font-medium">
                    {editableId ? 'Continue' : 'Skip'}
                  </Text>
                </Button>
                {editableId && (
                  <Button variant="primary" onPress={goNext} className="flex-1">
                    <Text className="text-white font-medium">Continue</Text>
                  </Button>
                )}
              </View>
            </View>
          </ScrollView>
        )

      // Step 4: Review & Confirm
      case 3:
        return (
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            <View className="gap-4">
              <Text className="text-xl font-bold text-coal">Review & Save</Text>

              {/* Photo preview */}
              {seedPhoto && (
                <Image
                  source={{ uri: seedPhoto.uri }}
                  className="w-full h-40 rounded-lg"
                  resizeMode="cover"
                />
              )}

              {/* Summary card */}
              <Card>
                <CardContent className="gap-3">
                  {exifData?.dateTaken && (
                    <View className="flex-row justify-between">
                      <Text className="text-coal/60">Planted</Text>
                      <Text className="font-medium text-coal">
                        {formatDateTime(exifData.dateTaken)}
                      </Text>
                    </View>
                  )}
                  {(exifData?.locationName || exifData?.latitude) && (
                    <View className="flex-row justify-between">
                      <Text className="text-coal/60">Location</Text>
                      <Text className="font-medium text-coal text-right flex-1 ml-4" numberOfLines={2}>
                        {exifData.locationName || `${exifData.latitude!.toFixed(4)}, ${exifData.longitude!.toFixed(4)}`}
                      </Text>
                    </View>
                  )}
                  {motherPlant && (
                    <View className="flex-row justify-between">
                      <Text className="text-coal/60">Mother Plant</Text>
                      <Text className="font-medium text-coal">
                        {motherPlant.custom_name || motherPlant.common_name}
                      </Text>
                    </View>
                  )}
                  {editableId && (
                    <View className="flex-row justify-between">
                      <Text className="text-coal/60">Plant ID</Text>
                      <Text className="font-medium text-coal">{editableId}</Text>
                    </View>
                  )}
                </CardContent>
              </Card>

              {/* Editable details */}
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
                <Button variant="outline" onPress={goBack} className="flex-1">
                  <Text className="text-coal font-medium">Back</Text>
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
        )

      default:
        return null
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-soft">
        <Header
          title={WIZARD_STEPS[step].title}
          showBack
          onBack={goBack}
        />
        {renderStepIndicator()}
        {renderStep()}
        <BottomNav />
      </View>
    </KeyboardAvoidingView>
  )
}
