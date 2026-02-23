import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Alert,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase/client'

interface ExtractedPacket {
  plant_type: string | null
  brand: string | null
  variety_name: string | null
  days_to_germination_min: number | null
  days_to_germination_max: number | null
  days_to_maturity_min: number | null
  days_to_maturity_max: number | null
  planting_depth_inches: number | null
  spacing_inches: number | null
  indoor_start_weeks_before_frost: number | null
  direct_sow_after_frost: boolean
  soil_temperature_min_f: number | null
  requires_stratification: boolean
  stratification_days: number | null
  requires_scarification: boolean
  requires_soaking: boolean
  soaking_hours: number | null
  confidence: number
  // UI state
  selected: boolean
  customName: string
}

export default function BatchScanSeedPackets() {
  const router = useRouter()
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [packets, setPackets] = useState<ExtractedPacket[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to scan seed packets.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9, // Higher quality for multiple packets
      allowsEditing: false,
    })

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
      await scanPackets(result.assets[0].uri)
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
      quality: 0.9,
      allowsEditing: false,
    })

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
      await scanPackets(result.assets[0].uri)
    }
  }

  const scanPackets = async (uri: string) => {
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
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/extract-seed-packets-batch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ image: base64 }),
        }
      )

      // Delete the temporary image file after extraction
      await cleanupImage(uri)

      if (!response.ok) {
        throw new Error('Failed to scan packets')
      }

      const data = await response.json()

      if (data.packets && data.packets.length > 0) {
        // Add UI state to each packet
        const packetsWithState = data.packets.map((p: any) => ({
          ...p,
          selected: true,
          customName: p.plant_type || p.variety_name || '',
        }))
        setPackets(packetsWithState)
        setPhotoUri(null) // Clear photo reference since file is deleted
      } else {
        Alert.alert(
          'No Packets Found',
          'Could not detect any seed packets in the image. Try taking a clearer photo with packets spread out.',
          [{ text: 'Try Again', onPress: () => resetScan() }]
        )
      }
    } catch (error) {
      console.error('Scan error:', error)
      Alert.alert(
        'Scan Failed',
        'Could not read the seed packets. Please try again with a clearer photo.'
      )
      await cleanupImage(uri)
    } finally {
      setIsScanning(false)
    }
  }

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

  const togglePacketSelection = (index: number) => {
    setPackets(prev => prev.map((p, i) =>
      i === index ? { ...p, selected: !p.selected } : p
    ))
  }

  const updatePacketName = (index: number, name: string) => {
    setPackets(prev => prev.map((p, i) =>
      i === index ? { ...p, customName: name } : p
    ))
  }

  const removePacket = (index: number) => {
    setPackets(prev => prev.filter((_, i) => i !== index))
  }

  const resetScan = () => {
    if (photoUri) {
      cleanupImage(photoUri)
    }
    setPhotoUri(null)
    setPackets([])
  }

  const handleImport = async () => {
    const selectedPackets = packets.filter(p => p.selected && p.customName.trim())

    if (selectedPackets.length === 0) {
      Alert.alert('No Seeds Selected', 'Please select at least one seed packet to import.')
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

      let successCount = 0
      let errorCount = 0

      for (const packet of selectedPackets) {
        try {
          // Create the plant with status='seed'
          const { data: plant, error: plantError } = await supabase
            .from('plants')
            .insert({
              garden_id: garden.id,
              common_name: packet.customName.trim(),
              custom_name: packet.variety_name || packet.customName.trim(),
              status: 'seed',
              health_status: 'healthy',
              acquired_date: new Date().toISOString().split('T')[0],
              acquisition_source: 'seed_packet',
            })
            .select()
            .single()

          if (plantError) throw plantError

          // Create seed packet data
          if (plant) {
            await supabase
              .from('seed_packet_data')
              .insert({
                plant_id: plant.id,
                brand: packet.brand,
                variety_name: packet.variety_name,
                days_to_germination_min: packet.days_to_germination_min,
                days_to_germination_max: packet.days_to_germination_max,
                days_to_maturity_min: packet.days_to_maturity_min,
                days_to_maturity_max: packet.days_to_maturity_max,
                planting_depth_inches: packet.planting_depth_inches,
                spacing_inches: packet.spacing_inches,
                indoor_start_weeks_before_frost: packet.indoor_start_weeks_before_frost,
                direct_sow_after_frost: packet.direct_sow_after_frost,
                soil_temperature_min_f: packet.soil_temperature_min_f,
                requires_stratification: packet.requires_stratification,
                stratification_days: packet.stratification_days,
                requires_scarification: packet.requires_scarification,
                requires_soaking: packet.requires_soaking,
                soaking_hours: packet.soaking_hours,
                extraction_confidence: packet.confidence,
              })
          }

          successCount++
        } catch (error) {
          console.error('Error adding packet:', error)
          errorCount++
        }
      }

      if (errorCount > 0) {
        Alert.alert(
          'Partial Import',
          `Added ${successCount} seeds. ${errorCount} failed to import.`,
          [{ text: 'View Collection', onPress: () => router.replace('/seeds') }]
        )
      } else {
        Alert.alert(
          'Import Complete!',
          `Added ${successCount} seeds to your collection.`,
          [
            { text: 'Scan More', onPress: () => resetScan() },
            { text: 'View Collection', onPress: () => router.replace('/seeds') },
          ]
        )
      }
    } catch (error) {
      console.error('Error importing seeds:', error)
      Alert.alert('Error', 'Failed to import seeds. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCount = packets.filter(p => p.selected).length

  // Initial state - no photo taken yet
  if (packets.length === 0 && !isScanning) {
    return (
      <View className="flex-1 bg-soft">
        <Header title="Batch Scan" showBack />

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          <View className="gap-4">
            <Card>
              <CardContent>
                <Text className="text-lg font-semibold text-coal mb-2">
                  Scan Multiple Seed Packets
                </Text>
                <Text className="text-sm text-coal/60 mb-4">
                  Lay out your seed packets on a flat surface and take a photo. We'll identify each packet and extract the planting information.
                </Text>

                <View className="bg-forest/5 p-3 rounded-lg mb-4">
                  <Text className="text-sm font-medium text-forest mb-2">Tips for best results:</Text>
                  <Text className="text-xs text-coal/70">
                    {'\u2022'} Spread packets out so they don't overlap{'\n'}
                    {'\u2022'} Make sure text on packets is visible{'\n'}
                    {'\u2022'} Use good lighting{'\n'}
                    {'\u2022'} Include 3-10 packets per photo
                  </Text>
                </View>

                <Text className="text-xs text-coal/50 text-center mb-4">
                  Photos are processed and immediately deleted - not stored.
                </Text>
              </CardContent>
            </Card>

            <Pressable
              onPress={takePhoto}
              className="bg-soft border-2 border-dashed border-forest/30 rounded-lg h-48 items-center justify-center active:bg-forest/5"
            >
              <Text className="text-4xl mb-2">📷</Text>
              <Text className="text-forest font-medium">Take Photo of Seed Packets</Text>
              <Text className="text-xs text-coal/50 mt-1">Lay them out so we can see each one</Text>
            </Pressable>

            <Button variant="outline" onPress={pickImage}>
              <Text className="text-coal">Choose from Library</Text>
            </Button>

            <Button variant="outline" onPress={() => router.back()}>
              <Text className="text-coal/60">Cancel</Text>
            </Button>
          </View>
        </ScrollView>
      </View>
    )
  }

  // Scanning state
  if (isScanning) {
    return (
      <View className="flex-1 bg-soft">
        <Header title="Scanning..." showBack />

        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">🔍</Text>
          <Text className="text-lg font-medium text-coal mb-2">
            Analyzing seed packets...
          </Text>
          <Text className="text-sm text-coal/60 text-center">
            Identifying each packet and extracting planting information
          </Text>
        </View>
      </View>
    )
  }

  // Results state - show list of detected packets
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-soft">
        <Header title={`${packets.length} Packets Found`} showBack />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-3">
            <Text className="text-sm text-coal/60">
              Review and edit the detected seeds. Uncheck any you don't want to import.
            </Text>

            {packets.map((packet, index) => (
              <Card key={index}>
                <CardContent className="py-3">
                  <View className="flex-row items-start gap-3">
                    {/* Checkbox */}
                    <Pressable
                      onPress={() => togglePacketSelection(index)}
                      className="pt-1"
                    >
                      <View
                        className={`w-6 h-6 rounded border-2 items-center justify-center ${
                          packet.selected
                            ? 'bg-forest border-forest'
                            : 'border-coal/30'
                        }`}
                      >
                        {packet.selected && (
                          <Text className="text-white text-sm">✓</Text>
                        )}
                      </View>
                    </Pressable>

                    {/* Content */}
                    <View className="flex-1">
                      <Input
                        value={packet.customName}
                        onChangeText={(v) => updatePacketName(index, v)}
                        placeholder="Plant name"
                        className="mb-2"
                      />

                      <View className="flex-row flex-wrap gap-2 mb-2">
                        {packet.brand && (
                          <View className="bg-coal/5 px-2 py-1 rounded">
                            <Text className="text-xs text-coal/70">{packet.brand}</Text>
                          </View>
                        )}
                        {packet.variety_name && (
                          <View className="bg-forest/10 px-2 py-1 rounded">
                            <Text className="text-xs text-forest">{packet.variety_name}</Text>
                          </View>
                        )}
                      </View>

                      {/* Quick info */}
                      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                        {(packet.days_to_germination_min || packet.days_to_germination_max) && (
                          <Text className="text-xs text-coal/60">
                            Germ: {packet.days_to_germination_min || '?'}-{packet.days_to_germination_max || '?'}d
                          </Text>
                        )}
                        {packet.indoor_start_weeks_before_frost && (
                          <Text className="text-xs text-coal/60">
                            Start: {packet.indoor_start_weeks_before_frost}w before frost
                          </Text>
                        )}
                        {packet.direct_sow_after_frost && (
                          <Text className="text-xs text-coal/60">Direct sow</Text>
                        )}
                      </View>

                      {/* Treatment badges */}
                      {(packet.requires_stratification || packet.requires_scarification || packet.requires_soaking) && (
                        <View className="flex-row gap-2 mt-2">
                          {packet.requires_stratification && (
                            <View className="bg-blue-50 px-2 py-0.5 rounded">
                              <Text className="text-xs text-blue-700">Stratify</Text>
                            </View>
                          )}
                          {packet.requires_scarification && (
                            <View className="bg-orange-50 px-2 py-0.5 rounded">
                              <Text className="text-xs text-orange-700">Scarify</Text>
                            </View>
                          )}
                          {packet.requires_soaking && (
                            <View className="bg-cyan-50 px-2 py-0.5 rounded">
                              <Text className="text-xs text-cyan-700">Soak</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Confidence indicator */}
                      <View className="flex-row items-center gap-1 mt-2">
                        <View
                          className={`w-2 h-2 rounded-full ${
                            packet.confidence > 0.8 ? 'bg-green-500' :
                            packet.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        />
                        <Text className="text-xs text-coal/40">
                          {packet.confidence > 0.8 ? 'High' :
                           packet.confidence > 0.5 ? 'Medium' : 'Low'} confidence
                        </Text>
                      </View>
                    </View>

                    {/* Remove button */}
                    <Pressable
                      onPress={() => removePacket(index)}
                      className="p-1"
                    >
                      <Text className="text-coal/30 text-lg">×</Text>
                    </Pressable>
                  </View>
                </CardContent>
              </Card>
            ))}

            {packets.length === 0 && (
              <Card>
                <CardContent className="py-8">
                  <Text className="text-center text-coal/60">
                    All packets removed. Scan again to detect more.
                  </Text>
                </CardContent>
              </Card>
            )}
          </View>
        </ScrollView>

        {/* Bottom action bar */}
        <View className="p-4 bg-white border-t border-soft">
          <View className="flex-row gap-3">
            <Button
              variant="outline"
              onPress={resetScan}
              className="flex-1"
            >
              <Text className="text-coal">Scan Again</Text>
            </Button>
            <Button
              variant="primary"
              onPress={handleImport}
              disabled={isSubmitting || selectedCount === 0}
              className="flex-1"
            >
              <Text className="text-white font-medium">
                {isSubmitting ? 'Importing...' : `Import ${selectedCount} Seeds`}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
