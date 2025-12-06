import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

const GARDEN_TYPES = [
  { value: 'indoor', label: 'Indoor', emoji: '🏠' },
  { value: 'outdoor', label: 'Outdoor', emoji: '🌳' },
  { value: 'container', label: 'Container', emoji: '🪴' },
  { value: 'raised_bed', label: 'Raised Bed', emoji: '📦' },
  { value: 'in_ground', label: 'In Ground', emoji: '🌱' },
  { value: 'greenhouse', label: 'Greenhouse', emoji: '🏡' },
  { value: 'community_plot', label: 'Community Plot', emoji: '👥' },
  { value: 'mixed', label: 'Mixed', emoji: '🌿' },
]

const SUN_EXPOSURE_OPTIONS = [
  { value: 'full_sun', label: 'Full Sun', emoji: '☀️' },
  { value: 'partial_shade', label: 'Partial Shade', emoji: '⛅' },
  { value: 'full_shade', label: 'Full Shade', emoji: '🌥️' },
  { value: 'varies', label: 'Varies', emoji: '🌤️' },
]

export default function EditGardenScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [gardenType, setGardenType] = useState('mixed')
  const [sunExposure, setSunExposure] = useState('varies')
  const [soilType, setSoilType] = useState('')
  const [siteId, setSiteId] = useState<string | null>(null)
  const [sites, setSites] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (id) {
      loadGarden()
      loadSites()
    }
  }, [id])

  const loadGarden = async () => {
    try {
      const { data: gardenData } = await supabase
        .from('gardens')
        .select('*')
        .eq('id', id)
        .single()

      if (gardenData) {
        setName(gardenData.name || '')
        setDescription(gardenData.description || '')
        setLocation(gardenData.location_description || '')
        setGardenType(gardenData.garden_type || 'mixed')
        setSunExposure(gardenData.sun_exposure || 'varies')
        setSoilType(gardenData.soil_type || '')
        setSiteId(gardenData.site_id || null)
      }
    } catch (error) {
      console.error('Error loading garden:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      // Try to load sites - will fail if table doesn't exist yet
      try {
        const { data: sitesData } = await supabase
          .from('sites')
          .select('*')
          .eq('gardener_id', gardener?.id)
          .order('name')

        setSites(sitesData || [])
      } catch (error) {
        // Sites table doesn't exist yet - that's ok
        console.log('Sites table not yet available')
      }
    } catch (error) {
      console.error('Error loading sites:', error)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a garden name')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('gardens')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          location_description: location.trim() || null,
          garden_type: gardenType,
          sun_exposure: sunExposure,
          soil_type: soilType.trim() || null,
          site_id: siteId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      router.back()
    } catch (error) {
      console.error('Error updating garden:', error)
      alert('Failed to update garden. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-soft">
        <Header showBack title="Edit Garden" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-coal/60">Loading...</Text>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-soft">
        <Header showBack title="Edit Garden" />

        <ScrollView className="flex-1" contentContainerClassName="pb-20">
          <View className="px-4 py-6 gap-6 max-w-4xl">
            <Card>
              <CardContent className="gap-4">
                <Input
                  label="Garden Name *"
                  placeholder="e.g., Backyard Garden, Balcony Pots"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <Input
                  label="Location"
                  placeholder="e.g., Backyard, South Window, Community Plot #5"
                  value={location}
                  onChangeText={setLocation}
                  autoCapitalize="words"
                />

                <Input
                  label="Description"
                  placeholder="Notes about this garden..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {/* Site Selection */}
                {sites.length > 0 && (
                  <View>
                    <Text className="text-sm font-medium text-coal mb-2">Site (Optional)</Text>
                    <View className="flex-row flex-wrap gap-2">
                      <Button
                        variant={siteId === null ? 'primary' : 'outline'}
                        size="sm"
                        onPress={() => setSiteId(null)}
                      >
                        <Text className={siteId === null ? 'text-white' : 'text-coal'}>
                          No Site
                        </Text>
                      </Button>
                      {sites.map((site) => (
                        <Button
                          key={site.id}
                          variant={siteId === site.id ? 'primary' : 'outline'}
                          size="sm"
                          onPress={() => setSiteId(site.id)}
                        >
                          <Text className={siteId === site.id ? 'text-white' : 'text-coal'}>
                            {site.name}
                          </Text>
                        </Button>
                      ))}
                    </View>
                  </View>
                )}

                {/* Garden Type Selection */}
                <View>
                  <Text className="text-sm font-medium text-coal mb-2">Garden Type</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {GARDEN_TYPES.map((type) => (
                      <Button
                        key={type.value}
                        variant={gardenType === type.value ? 'primary' : 'outline'}
                        size="sm"
                        onPress={() => setGardenType(type.value)}
                      >
                        <Text className={gardenType === type.value ? 'text-white' : 'text-coal'}>
                          {type.emoji} {type.label}
                        </Text>
                      </Button>
                    ))}
                  </View>
                </View>

                {/* Sun Exposure */}
                <View>
                  <Text className="text-sm font-medium text-coal mb-2">Sun Exposure</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {SUN_EXPOSURE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={sunExposure === option.value ? 'primary' : 'outline'}
                        size="sm"
                        onPress={() => setSunExposure(option.value)}
                      >
                        <Text className={sunExposure === option.value ? 'text-white' : 'text-coal'}>
                          {option.emoji} {option.label}
                        </Text>
                      </Button>
                    ))}
                  </View>
                </View>

                {/* Soil Type */}
                <Input
                  label="Soil Type (Optional)"
                  placeholder="e.g., clay, sandy, loam, potting mix"
                  value={soilType}
                  onChangeText={setSoilType}
                  autoCapitalize="words"
                />

                <View className="flex-row gap-3 mt-2">
                  <Button
                    variant="outline"
                    onPress={() => router.back()}
                    className="flex-1"
                  >
                    <Text className="text-coal font-medium">Cancel</Text>
                  </Button>
                  <Button
                    variant="primary"
                    onPress={handleSave}
                    disabled={isSaving || !name.trim()}
                    className="flex-1"
                  >
                    <Text className="text-white font-medium">
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </Button>
                </View>
              </CardContent>
            </Card>

            {/* Manage Sites Link */}
            <Card>
              <CardContent>
                <Text className="text-sm text-coal/60 mb-3">
                  💡 Sites group gardens by physical location and share weather/environmental data.
                </Text>
                <Button variant="outline" onPress={() => router.push('/sites')}>
                  <Text className="text-coal font-medium">🏡 Manage Sites</Text>
                </Button>
              </CardContent>
            </Card>
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </KeyboardAvoidingView>
  )
}
