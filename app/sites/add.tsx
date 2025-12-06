import React, { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { SiteLocationPicker } from '@/components/map/SiteLocationPicker'

interface Coordinate {
  latitude: number
  longitude: number
}

const HARDINESS_ZONES = [
  '1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b', '5a', '5b',
  '6a', '6b', '7a', '7b', '8a', '8b', '9a', '9b', '10a', '10b',
  '11a', '11b', '12a', '12b', '13a', '13b'
]

export default function AddSiteScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [locationDescription, setLocationDescription] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [boundary, setBoundary] = useState<Coordinate[]>([])
  const [hardinessZone, setHardinessZone] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')
  const [isSaving, setIsSaving] = useState(false)
  const [autoDetectedZone, setAutoDetectedZone] = useState<string | null>(null)

  const handleLocationChange = async (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)

    // Try to auto-detect hardiness zone
    try {
      const { data, error } = await supabase.rpc('get_hardiness_zone', {
        lat,
        lng
      })

      if (!error && data) {
        setAutoDetectedZone(data)
        if (!hardinessZone) {
          setHardinessZone(data)
        }
      }
    } catch (error) {
      console.log('Could not auto-detect zone:', error)
      // Silently fail - zone detection is optional
    }
  }

  const handleBoundaryChange = (polygon: Coordinate[]) => {
    setBoundary(polygon)
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a site name')
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/(auth)/login')
        return
      }

      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!gardener) {
        alert('Gardener profile not found')
        return
      }

      // Convert boundary polygon to PostGIS format if exists
      let boundaryWKT = null
      if (boundary.length >= 3) {
        const coords = boundary.map(c => `${c.longitude} ${c.latitude}`).join(',')
        const firstCoord = `${boundary[0].longitude} ${boundary[0].latitude}`
        boundaryWKT = `POLYGON((${coords},${firstCoord}))`
      }

      const { error } = await supabase
        .from('sites')
        .insert({
          id: crypto.randomUUID(),
          gardener_id: gardener.id,
          name: name.trim(),
          location_description: locationDescription.trim() || null,
          location_lat: latitude,
          location_lng: longitude,
          boundary: boundaryWKT,
          hardiness_zone: hardinessZone || null,
          timezone: timezone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      router.back()
    } catch (error) {
      console.error('Error creating site:', error)
      Alert.alert(
        'Error',
        'Failed to create site. Please make sure the Sites table has been created with the boundary column in your database.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-soft">
        <Header showBack title="Add Site" />

        <ScrollView className="flex-1" contentContainerClassName="pb-20">
          <View className="px-4 py-6 gap-6 max-w-4xl">
            <Card>
              <CardContent className="gap-4">
                <Text className="text-sm text-coal/60 mb-2">
                  Sites represent physical locations where you have multiple gardens. Each site can track shared environmental data like weather and hardiness zone.
                </Text>

                <Input
                  label="Site Name *"
                  placeholder="e.g., My House, Community Garden, Grandma's Farm"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <Input
                  label="Location Description"
                  placeholder="e.g., 123 Main St, Backyard, Plot #5"
                  value={locationDescription}
                  onChangeText={setLocationDescription}
                  autoCapitalize="words"
                />
              </CardContent>
            </Card>

            {/* Location & Boundary Picker */}
            <SiteLocationPicker
              onLocationChange={handleLocationChange}
              onBoundaryChange={handleBoundaryChange}
            />

            <Card>
              <CardContent className="gap-4">

                {/* Hardiness Zone Selection */}
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-medium text-coal">
                      USDA Hardiness Zone (Optional)
                    </Text>
                    {autoDetectedZone && (
                      <Text className="text-xs text-forest">
                        ✓ Auto-detected: Zone {autoDetectedZone}
                      </Text>
                    )}
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    <Button
                      variant={!hardinessZone ? 'primary' : 'outline'}
                      size="sm"
                      onPress={() => setHardinessZone('')}
                    >
                      <Text className={!hardinessZone ? 'text-white' : 'text-coal'}>
                        Not Set
                      </Text>
                    </Button>
                    {HARDINESS_ZONES.map((zone) => (
                      <Button
                        key={zone}
                        variant={hardinessZone === zone ? 'primary' : 'outline'}
                        size="sm"
                        onPress={() => setHardinessZone(zone)}
                      >
                        <Text className={hardinessZone === zone ? 'text-white' : 'text-coal'}>
                          Zone {zone}
                        </Text>
                      </Button>
                    ))}
                  </View>
                </View>

                {/* Timezone */}
                <Input
                  label="Timezone"
                  placeholder="e.g., America/New_York, Europe/London"
                  value={timezone}
                  onChangeText={setTimezone}
                  autoCapitalize="none"
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
                    onPress={handleCreate}
                    disabled={isSaving || !name.trim()}
                    className="flex-1"
                  >
                    <Text className="text-white font-medium">
                      {isSaving ? 'Creating...' : 'Create Site'}
                    </Text>
                  </Button>
                </View>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardContent>
                <Text className="text-sm text-coal/60">
                  💡{' '}<Text className="font-semibold">Tip:</Text>{' '}After creating a site, you can assign gardens to it when creating or editing a garden. All gardens at the same site will share location-specific data.
                </Text>
              </CardContent>
            </Card>
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </KeyboardAvoidingView>
  )
}
