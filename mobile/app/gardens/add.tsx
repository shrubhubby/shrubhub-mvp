import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { GardenLocationPicker } from '@/components/map/GardenLocationPicker.web'

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

interface Coordinate {
  latitude: number
  longitude: number
}

export default function AddGardenScreen() {
  const router = useRouter()
  const { siteId } = useLocalSearchParams()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [gardenType, setGardenType] = useState('mixed')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>((siteId as string) || null)
  const [sites, setSites] = useState<any[]>([])
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [boundary, setBoundary] = useState<Coordinate[]>([])

  useEffect(() => {
    loadUserSites()
  }, [])

  const loadUserSites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!gardener) return

      const { data: sitesData } = await supabase
        .from('sites')
        .select('id, name')
        .eq('gardener_id', gardener.id)
        .order('name')

      if (sitesData) {
        setSites(sitesData)
      }
    } catch (error) {
      console.error('Error loading sites:', error)
    }
  }

  const convertBoundaryToWKT = (coords: Coordinate[]): string | null => {
    if (coords.length < 3) return null

    // WKT format: POLYGON((lng lat, lng lat, ...))
    // Need to close the polygon by repeating first point at the end
    const coordStrings = coords.map(c => `${c.longitude} ${c.latitude}`)
    coordStrings.push(coordStrings[0]) // Close the polygon
    return `POLYGON((${coordStrings.join(', ')}))`
  }

  const handleCreateGarden = async () => {
    if (!name.trim()) {
      alert('Please enter a garden name')
      return
    }

    setIsLoading(true)
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

      // Create garden
      const boundaryWKT = convertBoundaryToWKT(boundary)
      const { error } = await supabase
        .from('gardens')
        .insert({
          gardener_id: gardener.id,
          name: name.trim(),
          description: description.trim() || null,
          location_description: location.trim() || null,
          garden_type: gardenType,
          is_primary: false, // New gardens are not primary by default
          site_id: selectedSiteId || null,
          location_lat: locationLat,
          location_lng: locationLng,
          boundary: boundaryWKT,
        })

      if (error) throw error

      router.back()
    } catch (error) {
      console.error('Error creating garden:', error)
      alert('Failed to create garden. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-soft">
        <Header showBack title="Add Garden" />

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
                  label="Description (Optional)"
                  placeholder="Notes about this garden..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

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
                        className="flex-grow-0"
                      >
                        <Text className={gardenType === type.value ? 'text-white' : 'text-coal'}>
                          {type.emoji} {type.label}
                        </Text>
                      </Button>
                    ))}
                  </View>
                </View>

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
                    onPress={handleCreateGarden}
                    disabled={isLoading || !name.trim()}
                    className="flex-1"
                  >
                    <Text className="text-white font-medium">
                      {isLoading ? 'Creating...' : 'Create Garden'}
                    </Text>
                  </Button>
                </View>
              </CardContent>
            </Card>

            {/* Site Selection */}
            {sites.length > 0 && (
              <Card>
                <CardContent className="gap-3">
                  <Text className="text-sm font-medium text-coal">Site (Optional)</Text>
                  <Text className="text-xs text-coal/60">
                    Associate this garden with a site to share location and environmental data
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    <Button
                      variant={selectedSiteId === null ? 'primary' : 'outline'}
                      size="sm"
                      onPress={() => setSelectedSiteId(null)}
                      className="flex-grow-0"
                    >
                      <Text className={selectedSiteId === null ? 'text-white' : 'text-coal'}>
                        No Site
                      </Text>
                    </Button>
                    {sites.map((site) => (
                      <Button
                        key={site.id}
                        variant={selectedSiteId === site.id ? 'primary' : 'outline'}
                        size="sm"
                        onPress={() => setSelectedSiteId(site.id)}
                        className="flex-grow-0"
                      >
                        <Text className={selectedSiteId === site.id ? 'text-white' : 'text-coal'}>
                          {site.name}
                        </Text>
                      </Button>
                    ))}
                  </View>
                </CardContent>
              </Card>
            )}

            {/* Garden Location & Boundary */}
            {typeof window !== 'undefined' && (
              <GardenLocationPicker
                siteId={selectedSiteId}
                onLocationChange={(lat, lng) => {
                  setLocationLat(lat)
                  setLocationLng(lng)
                }}
                onBoundaryChange={setBoundary}
              />
            )}
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </KeyboardAvoidingView>
  )
}
