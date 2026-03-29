import React, { useState } from 'react'
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SeedPacketScanner, SeedPacketExtraction } from '@/components/seed/SeedPacketScanner'
import { supabase } from '@/lib/supabase/client'

export default function ScanSeedPacket() {
  const router = useRouter()
  const [step, setStep] = useState<'scan' | 'details'>('scan')
  const [extraction, setExtraction] = useState<SeedPacketExtraction | null>(null)
  const [plantName, setPlantName] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleExtracted = (ext: SeedPacketExtraction) => {
    setExtraction(ext)
    setPlantName(ext.variety_name || '')
    setStep('details')
  }

  const handleSubmit = async () => {
    if (!plantName.trim()) {
      Alert.alert('Required', 'Please enter a plant name.')
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

      // Create the plant with status='seed'
      const { data: plant, error: plantError } = await supabase
        .from('plants')
        .insert({
          garden_id: garden.id,
          common_name: plantName.trim(),
          custom_name: extraction?.variety_name || plantName.trim(),
          status: 'seed',
          health_status: 'healthy',
          acquired_date: new Date().toISOString().split('T')[0],
          acquisition_source: 'seed_packet',
          acquisition_notes: notes.trim() || null,
        })
        .select()
        .single()

      if (plantError) throw plantError

      // Create seed packet data
      if (extraction && plant) {
        const { error: packetError } = await supabase
          .from('seed_packet_data')
          .insert({
            plant_id: plant.id,
            brand: extraction.brand,
            variety_name: extraction.variety_name,
            days_to_germination_min: extraction.days_to_germination_min,
            days_to_germination_max: extraction.days_to_germination_max,
            days_to_maturity_min: extraction.days_to_maturity_min,
            days_to_maturity_max: extraction.days_to_maturity_max,
            planting_depth_inches: extraction.planting_depth_inches,
            spacing_inches: extraction.spacing_inches,
            indoor_start_weeks_before_frost: extraction.indoor_start_weeks_before_frost,
            direct_sow_after_frost: extraction.direct_sow_after_frost,
            soil_temperature_min_f: extraction.soil_temperature_min_f,
            requires_stratification: extraction.requires_stratification,
            stratification_days: extraction.stratification_days,
            requires_scarification: extraction.requires_scarification,
            requires_soaking: extraction.requires_soaking,
            soaking_hours: extraction.soaking_hours,
            extraction_confidence: extraction.confidence,
            raw_extraction: extraction as unknown as Record<string, unknown>,
          })

        if (packetError) {
          console.error('Error saving packet data:', packetError)
        }
      }

      Alert.alert(
        'Seed Added!',
        `${plantName} has been added to your seed collection.`,
        [
          { text: 'Add Another', onPress: () => resetForm() },
          { text: 'View Collection', onPress: () => router.replace('/seeds') },
        ]
      )
    } catch (error) {
      console.error('Error adding seed:', error)
      Alert.alert('Error', 'Failed to add seed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setStep('scan')
    setExtraction(null)
    setPlantName('')
    setNotes('')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-soft">
        <Header title="Add Seed" showBack />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'scan' ? (
            <View className="gap-4">
              <SeedPacketScanner
                onExtracted={handleExtracted}
                onCancel={() => router.back()}
              />

              {/* Batch scan option */}
              <Pressable
                onPress={() => router.push('/seeds/batch-scan')}
                className="bg-forest/5 p-4 rounded-lg border border-forest/20"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">📦</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-forest">
                      Have multiple packets?
                    </Text>
                    <Text className="text-xs text-coal/60">
                      Scan them all at once with batch import
                    </Text>
                  </View>
                  <Text className="text-forest">→</Text>
                </View>
              </Pressable>

              <Text className="text-xs text-coal/40 text-center">
                Photos are processed and immediately deleted - not stored.
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              <Card>
                <CardContent className="gap-4">
                  <Input
                    label="Plant Name *"
                    value={plantName}
                    onChangeText={setPlantName}
                    placeholder="e.g., Tomato, Basil, Pepper"
                    autoCapitalize="words"
                  />

                  {extraction?.variety_name && extraction.variety_name !== plantName && (
                    <View className="bg-forest/5 p-3 rounded-lg">
                      <Text className="text-xs text-coal/60">Variety detected:</Text>
                      <Text className="text-sm text-coal">{extraction.variety_name}</Text>
                    </View>
                  )}

                  <Input
                    label="Notes (optional)"
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Any additional details..."
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </CardContent>
              </Card>

              {/* Summary of extracted info */}
              {extraction && (
                <Card>
                  <CardContent>
                    <Text className="text-sm font-medium text-coal mb-3">
                      Extracted Information
                    </Text>
                    <View className="gap-2">
                      {extraction.brand && (
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-coal/60">Brand</Text>
                          <Text className="text-sm text-coal">{extraction.brand}</Text>
                        </View>
                      )}
                      {(extraction.days_to_germination_min || extraction.days_to_germination_max) && (
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-coal/60">Germination</Text>
                          <Text className="text-sm text-coal">
                            {extraction.days_to_germination_min || '?'}-
                            {extraction.days_to_germination_max || '?'} days
                          </Text>
                        </View>
                      )}
                      {extraction.indoor_start_weeks_before_frost && (
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-coal/60">Start Indoors</Text>
                          <Text className="text-sm text-coal">
                            {extraction.indoor_start_weeks_before_frost} weeks before frost
                          </Text>
                        </View>
                      )}
                      {extraction.direct_sow_after_frost && (
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-coal/60">Direct Sow</Text>
                          <Text className="text-sm text-coal">After last frost</Text>
                        </View>
                      )}
                      {(extraction.requires_stratification || extraction.requires_scarification || extraction.requires_soaking) && (
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-coal/60">Special Treatment</Text>
                          <Text className="text-sm text-coal">
                            {[
                              extraction.requires_stratification && 'Stratification',
                              extraction.requires_scarification && 'Scarification',
                              extraction.requires_soaking && 'Soaking'
                            ].filter(Boolean).join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </CardContent>
                </Card>
              )}

              <View className="flex-row gap-3">
                <Button
                  variant="outline"
                  onPress={resetForm}
                  className="flex-1"
                >
                  <Text className="text-coal">Re-scan</Text>
                </Button>
                <Button
                  variant="primary"
                  onPress={handleSubmit}
                  disabled={isSubmitting || !plantName.trim()}
                  className="flex-1"
                >
                  <Text className="text-white font-medium">
                    {isSubmitting ? 'Adding...' : 'Add Seed'}
                  </Text>
                </Button>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}
