import React, { useState } from 'react'
import { View, Text, ScrollView, Alert, Pressable } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase/client'

export interface SeedPacketExtraction {
  brand: string | null
  variety_name: string | null
  scientific_name: string | null
  days_to_germination_min: number | null
  days_to_germination_max: number | null
  days_to_maturity_min: number | null
  days_to_maturity_max: number | null
  planting_depth_inches: number | null
  spacing_inches: number | null
  indoor_start_weeks_before_frost: number | null
  direct_sow_after_frost: boolean
  soil_temperature_min_f: number | null
  sun_requirement: string | null
  requires_stratification: boolean
  stratification_days: number | null
  requires_scarification: boolean
  requires_soaking: boolean
  soaking_hours: number | null
  confidence: number
}

interface SeedPacketScannerProps {
  onExtracted: (extraction: SeedPacketExtraction) => void
  onCancel?: () => void
}

export function SeedPacketScanner({ onExtracted, onCancel }: SeedPacketScannerProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [extraction, setExtraction] = useState<SeedPacketExtraction | null>(null)
  const [editedExtraction, setEditedExtraction] = useState<SeedPacketExtraction | null>(null)

  // Clean up image file after use
  const cleanupImage = async (uri: string) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri)
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true })
      }
    } catch (error) {
      console.log('Could not delete image:', error)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to scan seed packets.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    })

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
      scanPacket(result.assets[0].uri)
    }
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    })

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
      scanPacket(result.assets[0].uri)
    }
  }

  const scanPacket = async (uri: string) => {
    setIsScanning(true)
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        Alert.alert('Error', 'Please log in to scan seed packets.')
        return
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/extract-seed-packet`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ image: base64 }),
        }
      )

      // Delete the image after extraction - we don't store it
      await cleanupImage(uri)

      if (!response.ok) {
        throw new Error('Failed to scan packet')
      }

      const { extraction: ext } = await response.json()
      setExtraction(ext)
      setEditedExtraction(ext)
      setPhotoUri(null) // Clear reference since file is deleted
    } catch (error) {
      console.error('Scan error:', error)
      await cleanupImage(uri) // Clean up on error too
      Alert.alert('Scan Failed', 'Could not read the seed packet. Please try again or enter details manually.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleConfirm = () => {
    if (editedExtraction) {
      onExtracted(editedExtraction)
    }
  }

  const updateField = (field: keyof SeedPacketExtraction, value: any) => {
    if (editedExtraction) {
      setEditedExtraction({ ...editedExtraction, [field]: value })
    }
  }

  const retake = async () => {
    if (photoUri) {
      await cleanupImage(photoUri)
    }
    setPhotoUri(null)
    setExtraction(null)
    setEditedExtraction(null)
  }

  // Initial state - no photo
  if (!photoUri) {
    return (
      <View className="gap-4">
        <Text className="text-lg font-semibold text-coal text-center">
          Scan Seed Packet
        </Text>
        <Text className="text-sm text-coal/60 text-center">
          Take a photo of your seed packet and we'll extract the planting information.
        </Text>

        <Pressable
          onPress={takePhoto}
          className="bg-soft border-2 border-dashed border-forest/30 rounded-lg h-48 items-center justify-center active:bg-forest/5"
        >
          <Text className="text-4xl mb-2">📷</Text>
          <Text className="text-forest font-medium">Take Photo of Seed Packet</Text>
        </Pressable>

        <Button variant="outline" onPress={pickImage}>
          <Text className="text-coal">Choose from Library</Text>
        </Button>

        {onCancel && (
          <Button variant="outline" onPress={onCancel}>
            <Text className="text-coal/60">Cancel</Text>
          </Button>
        )}
      </View>
    )
  }

  // Scanning state
  if (isScanning) {
    return (
      <View className="gap-4">
        <View className="bg-forest/10 rounded-lg h-48 items-center justify-center">
          <Text className="text-5xl mb-2">🔍</Text>
          <Text className="text-lg text-coal mb-2">Scanning packet...</Text>
          <Text className="text-sm text-coal/60">Extracting planting information</Text>
        </View>
      </View>
    )
  }

  // Results state - show editable extraction
  if (editedExtraction) {
    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-4 pb-4">
          {/* Header with scan again option */}
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-coal/60">
              Review extracted information
            </Text>
            <Pressable
              onPress={retake}
              className="bg-coal/10 px-3 py-1 rounded-full"
            >
              <Text className="text-coal text-xs">Scan Again</Text>
            </Pressable>
          </View>

          {extraction?.confidence !== undefined && (
            <View className="flex-row items-center gap-2">
              <View
                className={`w-2 h-2 rounded-full ${
                  extraction.confidence > 0.8 ? 'bg-green-500' :
                  extraction.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              />
              <Text className="text-xs text-coal/60">
                {extraction.confidence > 0.8 ? 'High' :
                 extraction.confidence > 0.5 ? 'Medium' : 'Low'} confidence extraction
              </Text>
            </View>
          )}

          <Card>
            <CardContent className="gap-3">
              <Text className="text-sm font-medium text-coal">Basic Info</Text>

              <Input
                label="Variety Name"
                value={editedExtraction.variety_name || ''}
                onChangeText={(v) => updateField('variety_name', v || null)}
                placeholder="e.g., Big Boy, Sugar Snap"
              />

              <Input
                label="Brand"
                value={editedExtraction.brand || ''}
                onChangeText={(v) => updateField('brand', v || null)}
                placeholder="e.g., Burpee, Ferry-Morse"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="gap-3">
              <Text className="text-sm font-medium text-coal">Timing</Text>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Days to Germinate (Min)"
                    value={editedExtraction.days_to_germination_min?.toString() || ''}
                    onChangeText={(v) => updateField('days_to_germination_min', v ? parseInt(v) : null)}
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Max"
                    value={editedExtraction.days_to_germination_max?.toString() || ''}
                    onChangeText={(v) => updateField('days_to_germination_max', v ? parseInt(v) : null)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Days to Maturity (Min)"
                    value={editedExtraction.days_to_maturity_min?.toString() || ''}
                    onChangeText={(v) => updateField('days_to_maturity_min', v ? parseInt(v) : null)}
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Max"
                    value={editedExtraction.days_to_maturity_max?.toString() || ''}
                    onChangeText={(v) => updateField('days_to_maturity_max', v ? parseInt(v) : null)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Input
                label="Start Indoors (weeks before last frost)"
                value={editedExtraction.indoor_start_weeks_before_frost?.toString() || ''}
                onChangeText={(v) => updateField('indoor_start_weeks_before_frost', v ? parseInt(v) : null)}
                keyboardType="numeric"
                placeholder="e.g., 6"
              />

              <Pressable
                onPress={() => updateField('direct_sow_after_frost', !editedExtraction.direct_sow_after_frost)}
                className="flex-row items-center gap-2 py-2"
              >
                <View className={`w-5 h-5 rounded border ${editedExtraction.direct_sow_after_frost ? 'bg-forest border-forest' : 'border-coal/30'} items-center justify-center`}>
                  {editedExtraction.direct_sow_after_frost && <Text className="text-white text-xs">✓</Text>}
                </View>
                <Text className="text-sm text-coal">Direct sow after frost</Text>
              </Pressable>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="gap-3">
              <Text className="text-sm font-medium text-coal">Planting Details</Text>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Depth (inches)"
                    value={editedExtraction.planting_depth_inches?.toString() || ''}
                    onChangeText={(v) => updateField('planting_depth_inches', v ? parseFloat(v) : null)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Spacing (inches)"
                    value={editedExtraction.spacing_inches?.toString() || ''}
                    onChangeText={(v) => updateField('spacing_inches', v ? parseFloat(v) : null)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Input
                label="Min Soil Temp (°F)"
                value={editedExtraction.soil_temperature_min_f?.toString() || ''}
                onChangeText={(v) => updateField('soil_temperature_min_f', v ? parseInt(v) : null)}
                keyboardType="numeric"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="gap-3">
              <Text className="text-sm font-medium text-coal">Special Treatments</Text>

              <Pressable
                onPress={() => updateField('requires_stratification', !editedExtraction.requires_stratification)}
                className="flex-row items-center gap-2 py-2"
              >
                <View className={`w-5 h-5 rounded border ${editedExtraction.requires_stratification ? 'bg-forest border-forest' : 'border-coal/30'} items-center justify-center`}>
                  {editedExtraction.requires_stratification && <Text className="text-white text-xs">✓</Text>}
                </View>
                <Text className="text-sm text-coal">Requires cold stratification</Text>
              </Pressable>

              {editedExtraction.requires_stratification && (
                <Input
                  label="Stratification Days"
                  value={editedExtraction.stratification_days?.toString() || ''}
                  onChangeText={(v) => updateField('stratification_days', v ? parseInt(v) : null)}
                  keyboardType="numeric"
                />
              )}

              <Pressable
                onPress={() => updateField('requires_scarification', !editedExtraction.requires_scarification)}
                className="flex-row items-center gap-2 py-2"
              >
                <View className={`w-5 h-5 rounded border ${editedExtraction.requires_scarification ? 'bg-forest border-forest' : 'border-coal/30'} items-center justify-center`}>
                  {editedExtraction.requires_scarification && <Text className="text-white text-xs">✓</Text>}
                </View>
                <Text className="text-sm text-coal">Requires scarification</Text>
              </Pressable>

              <Pressable
                onPress={() => updateField('requires_soaking', !editedExtraction.requires_soaking)}
                className="flex-row items-center gap-2 py-2"
              >
                <View className={`w-5 h-5 rounded border ${editedExtraction.requires_soaking ? 'bg-forest border-forest' : 'border-coal/30'} items-center justify-center`}>
                  {editedExtraction.requires_soaking && <Text className="text-white text-xs">✓</Text>}
                </View>
                <Text className="text-sm text-coal">Requires soaking</Text>
              </Pressable>

              {editedExtraction.requires_soaking && (
                <Input
                  label="Soaking Hours"
                  value={editedExtraction.soaking_hours?.toString() || ''}
                  onChangeText={(v) => updateField('soaking_hours', v ? parseInt(v) : null)}
                  keyboardType="numeric"
                />
              )}
            </CardContent>
          </Card>

          <View className="flex-row gap-3">
            {onCancel && (
              <Button variant="outline" onPress={onCancel} className="flex-1">
                <Text className="text-coal">Cancel</Text>
              </Button>
            )}
            <Button variant="primary" onPress={handleConfirm} className="flex-1">
              <Text className="text-white font-medium">Add to Collection</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    )
  }

  return null
}
