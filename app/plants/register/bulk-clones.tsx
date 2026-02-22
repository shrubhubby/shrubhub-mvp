import React, { useState, useEffect } from 'react'
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
import { MotherPlantSelector } from '@/components/plant/MotherPlantSelector'
import { PhotoCapture, CapturedPhoto } from '@/components/plant/PhotoCapture'
import { BulkCloneList, CloneData, generateCloneList } from '@/components/plant/BulkCloneList'
import { supabase } from '@/lib/supabase/client'

type PhotoMethod = 'group_photo' | 'individual' | 'qr_scan' | 'no_photo'

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
  { key: 'mother', title: 'Select Mother Plant' },
  { key: 'count', title: 'Clone Details' },
  { key: 'photo', title: 'Capture Photos' },
  { key: 'review', title: 'Review & Edit' },
  { key: 'confirm', title: 'Confirm' },
]

export default function BulkClonesWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [gardenerId, setGardenerId] = useState<string | undefined>()

  // Step 1: Mother plant
  const [motherPlant, setMotherPlant] = useState<MotherPlant | null>(null)

  // Step 2: Count and photo method
  const [cloneCount, setCloneCount] = useState('1')
  const [photoMethod, setPhotoMethod] = useState<PhotoMethod>('no_photo')

  // Step 3: Photos
  const [groupPhoto, setGroupPhoto] = useState<CapturedPhoto | null>(null)

  // Step 4: Clones list
  const [clones, setClones] = useState<CloneData[]>([])

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadGardenerId()
  }, [])

  const loadGardenerId = async () => {
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
    }
  }

  const getMotherDisplayName = () => {
    if (!motherPlant) return ''
    return motherPlant.custom_name || motherPlant.common_name
  }

  const handleMotherSelect = (plant: MotherPlant) => {
    setMotherPlant(plant)
  }

  const handleNextFromCount = () => {
    const count = parseInt(cloneCount, 10)
    if (isNaN(count) || count < 1) {
      Alert.alert('Invalid Count', 'Please enter a valid number of clones (1 or more).')
      return
    }

    // Generate initial clone list
    const initialClones = generateCloneList(count, getMotherDisplayName())
    setClones(initialClones)

    // Skip photo step if no_photo selected
    if (photoMethod === 'no_photo') {
      setStep(3) // Jump to review
    } else {
      setStep(2)
    }
  }

  const handleGroupPhotoTaken = (photo: CapturedPhoto) => {
    setGroupPhoto(photo)
    // In a real implementation, we would send to AI for cropping here
    // For now, just proceed to review
  }

  const handleUpdateClone = (index: number, updates: Partial<CloneData>) => {
    setClones((prev) =>
      prev.map((clone) =>
        clone.index === index ? { ...clone, ...updates } : clone
      )
    )
  }

  const handleRemoveClone = (index: number) => {
    setClones((prev) => {
      const newClones = prev.filter((c) => c.index !== index)
      // Re-index
      return newClones.map((clone, i) => ({ ...clone, index: i }))
    })
    setCloneCount(String(clones.length - 1))
  }

  const handleAddClone = () => {
    const newIndex = clones.length
    const newClone: CloneData = {
      index: newIndex,
      name: `${getMotherDisplayName()} Clone #${newIndex + 1}`,
      editableId: '',
    }
    setClones((prev) => [...prev, newClone])
    setCloneCount(String(clones.length + 1))
  }

  const handleSubmit = async () => {
    if (!gardenerId || !motherPlant) return

    setIsSubmitting(true)
    try {
      // Create registration batch
      const { data: batch, error: batchError } = await supabase
        .from('plant_registration_batches')
        .insert({
          gardener_id: gardenerId,
          garden_id: motherPlant.garden_id,
          parent_plant_id: motherPlant.id,
          batch_type: 'clone',
          total_count: clones.length,
          photo_method: photoMethod,
          metadata: {
            mother_plant_name: getMotherDisplayName(),
            group_photo_uri: groupPhoto?.uri,
          },
        })
        .select()
        .single()

      if (batchError) throw batchError

      // Create all plants
      const plantsToInsert = clones.map((clone) => ({
        garden_id: motherPlant.garden_id,
        plant_master_id: (motherPlant as any).plant_master_id || null,
        parent_plant_id: motherPlant.id,
        common_name: clone.name,
        custom_name: clone.name,
        acquired_date: new Date().toISOString().split('T')[0],
        acquisition_source: 'propagation',
        acquisition_notes: `Clone #${clone.index + 1} from ${getMotherDisplayName()}`,
        clone_number: clone.index + 1,
        editable_id: clone.editableId || null,
        registration_batch_id: batch.id,
        status: 'vegetative',
        health_status: 'healthy',
      }))

      const { error: plantsError } = await supabase
        .from('plants')
        .insert(plantsToInsert)

      if (plantsError) throw plantsError

      Alert.alert(
        'Success!',
        `Registered ${clones.length} clone${clones.length !== 1 ? 's' : ''} from ${getMotherDisplayName()}`,
        [
          {
            text: 'View Plants',
            onPress: () => router.replace('/(tabs)/plants'),
          },
        ]
      )
    } catch (error) {
      console.error('Error registering clones:', error)
      Alert.alert('Error', 'Failed to register clones. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const goBack = () => {
    if (step === 0) {
      router.back()
    } else if (step === 3 && photoMethod === 'no_photo') {
      setStep(1) // Skip back over photo step
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
      case 0:
        return (
          <View className="flex-1">
            <View className="px-4 py-2">
              <Text className="text-lg font-bold text-coal">
                Select Mother Plant
              </Text>
              <Text className="text-sm text-coal/60">
                Choose the plant you're taking cuttings from
              </Text>
            </View>
            {gardenerId && (
              <MotherPlantSelector
                gardenerId={gardenerId}
                onSelect={handleMotherSelect}
                selectedPlantId={motherPlant?.id}
              />
            )}
            <View className="p-4 border-t border-soft bg-white">
              <Button
                variant="primary"
                onPress={goNext}
                disabled={!motherPlant}
              >
                <Text className="text-white font-medium">
                  Continue with {motherPlant ? getMotherDisplayName() : 'selected plant'}
                </Text>
              </Button>
            </View>
          </View>
        )

      case 1:
        return (
          <ScrollView className="flex-1">
            <View className="p-4 gap-6">
              {/* Mother plant info */}
              {motherPlant && (
                <Card>
                  <CardContent className="flex-row items-center gap-3">
                    <Text className="text-3xl">🌿</Text>
                    <View className="flex-1">
                      <Text className="font-semibold text-coal">
                        Mother: {getMotherDisplayName()}
                      </Text>
                      {motherPlant.plants_master?.scientific_name && (
                        <Text className="text-sm text-coal/60 italic">
                          {motherPlant.plants_master.scientific_name}
                        </Text>
                      )}
                    </View>
                  </CardContent>
                </Card>
              )}

              {/* Clone count */}
              <View>
                <Text className="text-lg font-bold text-coal mb-2">
                  How many cuttings?
                </Text>
                <Input
                  label="Number of clones"
                  value={cloneCount}
                  onChangeText={setCloneCount}
                  keyboardType="numeric"
                  placeholder="Enter number"
                />
              </View>

              {/* Photo method */}
              <View>
                <Text className="text-lg font-bold text-coal mb-2">
                  Photo Method
                </Text>
                <Text className="text-sm text-coal/60 mb-3">
                  How do you want to capture photos?
                </Text>

                <View className="gap-2">
                  {[
                    { value: 'group_photo', label: '📸 One Group Photo', desc: 'Take a single photo of all cuttings' },
                    { value: 'individual', label: '📷 Individual Photos', desc: 'Take a photo for each cutting' },
                    { value: 'qr_scan', label: '🔳 QR Codes in Photos', desc: 'Photos include QR codes for IDs' },
                    { value: 'no_photo', label: '⏭️ No Photos Now', desc: 'Register now, add photos later' },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={photoMethod === option.value ? 'primary' : 'outline'}
                      onPress={() => setPhotoMethod(option.value as PhotoMethod)}
                      className="justify-start"
                    >
                      <View className="flex-1">
                        <Text
                          className={`font-medium ${
                            photoMethod === option.value ? 'text-white' : 'text-coal'
                          }`}
                        >
                          {option.label}
                        </Text>
                        <Text
                          className={`text-xs ${
                            photoMethod === option.value ? 'text-white/70' : 'text-coal/60'
                          }`}
                        >
                          {option.desc}
                        </Text>
                      </View>
                    </Button>
                  ))}
                </View>
              </View>

              {/* Continue button */}
              <Button variant="primary" onPress={handleNextFromCount}>
                <Text className="text-white font-medium">Continue</Text>
              </Button>
            </View>
          </ScrollView>
        )

      case 2:
        return (
          <ScrollView className="flex-1">
            <View className="p-4 gap-4">
              <Text className="text-lg font-bold text-coal">
                {photoMethod === 'group_photo'
                  ? 'Take Group Photo'
                  : photoMethod === 'individual'
                  ? 'Capture Individual Photos'
                  : 'Scan QR Codes'}
              </Text>

              {photoMethod === 'group_photo' && (
                <>
                  <Text className="text-sm text-coal/60">
                    Take a photo of all your cuttings together. Our AI can help
                    identify individual plants in the photo.
                  </Text>
                  <PhotoCapture
                    onPhotoTaken={handleGroupPhotoTaken}
                    existingPhotoUri={groupPhoto?.uri}
                    helpText="Position all cuttings clearly in frame"
                  />
                </>
              )}

              {photoMethod === 'individual' && (
                <>
                  <Text className="text-sm text-coal/60">
                    Take a photo for each of your {cloneCount} cuttings. You can
                    also skip this and add photos later.
                  </Text>
                  {/* Individual photo capture would go here */}
                  <Card>
                    <CardContent>
                      <Text className="text-coal/60 text-center">
                        Individual photo capture coming soon. You can add photos
                        after registration.
                      </Text>
                    </CardContent>
                  </Card>
                </>
              )}

              {photoMethod === 'qr_scan' && (
                <>
                  <Text className="text-sm text-coal/60">
                    Take photos of your cuttings with QR codes visible. The IDs
                    will be automatically extracted.
                  </Text>
                  <Card>
                    <CardContent>
                      <Text className="text-coal/60 text-center">
                        QR code scanning coming soon. You can add IDs manually
                        in the next step.
                      </Text>
                    </CardContent>
                  </Card>
                </>
              )}

              <View className="flex-row gap-2 mt-4">
                <Button variant="outline" onPress={() => setStep(3)} className="flex-1">
                  <Text className="text-coal">Skip for Now</Text>
                </Button>
                <Button variant="primary" onPress={goNext} className="flex-1">
                  <Text className="text-white font-medium">Continue</Text>
                </Button>
              </View>
            </View>
          </ScrollView>
        )

      case 3:
        return (
          <View className="flex-1">
            <BulkCloneList
              clones={clones}
              motherPlantName={getMotherDisplayName()}
              onUpdateClone={handleUpdateClone}
              onRemoveClone={handleRemoveClone}
            />
            <View className="p-4 border-t border-soft bg-white gap-2">
              <Button variant="outline" onPress={handleAddClone}>
                <Text className="text-forest">+ Add Another Clone</Text>
              </Button>
              <Button variant="primary" onPress={goNext}>
                <Text className="text-white font-medium">Review & Confirm</Text>
              </Button>
            </View>
          </View>
        )

      case 4:
        return (
          <ScrollView className="flex-1">
            <View className="p-4 gap-4">
              <Text className="text-lg font-bold text-coal">
                Confirm Registration
              </Text>

              {/* Summary */}
              <Card>
                <CardContent className="gap-3">
                  <View className="flex-row justify-between">
                    <Text className="text-coal/60">Mother Plant</Text>
                    <Text className="font-medium text-coal">
                      {getMotherDisplayName()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-coal/60">Number of Clones</Text>
                    <Text className="font-medium text-coal">{clones.length}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-coal/60">Photo Method</Text>
                    <Text className="font-medium text-coal">
                      {photoMethod === 'group_photo'
                        ? 'Group Photo'
                        : photoMethod === 'individual'
                        ? 'Individual'
                        : photoMethod === 'qr_scan'
                        ? 'QR Codes'
                        : 'No Photos'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-coal/60">Destination Garden</Text>
                    <Text className="font-medium text-coal">
                      Same as mother plant
                    </Text>
                  </View>
                </CardContent>
              </Card>

              {/* Clone names preview */}
              <View>
                <Text className="font-medium text-coal mb-2">Clones to Register:</Text>
                <Card>
                  <CardContent className="gap-1">
                    {clones.slice(0, 5).map((clone) => (
                      <Text key={clone.index} className="text-sm text-coal/80">
                        • {clone.name}
                        {clone.editableId && ` (ID: ${clone.editableId})`}
                      </Text>
                    ))}
                    {clones.length > 5 && (
                      <Text className="text-sm text-coal/60">
                        ... and {clones.length - 5} more
                      </Text>
                    )}
                  </CardContent>
                </Card>
              </View>

              {/* Submit button */}
              <Button
                variant="primary"
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text className="text-white font-medium">
                  {isSubmitting
                    ? 'Registering...'
                    : `Register ${clones.length} Clone${clones.length !== 1 ? 's' : ''}`}
                </Text>
              </Button>

              <Button variant="outline" onPress={() => setStep(3)}>
                <Text className="text-coal">Back to Edit</Text>
              </Button>
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
