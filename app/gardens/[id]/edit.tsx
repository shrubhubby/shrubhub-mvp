import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
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

export default function EditGardenScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [gardenType, setGardenType] = useState('mixed')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [sites, setSites] = useState<any[]>([])
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [boundary, setBoundary] = useState<Coordinate[]>([])
  const [initialLocation, setInitialLocation] = useState<{ latitude: number; longitude: number } | undefined>()
  const [initialBoundary, setInitialBoundary] = useState<Coordinate[]>([])

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

  const parseBoundaryFromWKT = (wkt: string): Coordinate[] => {
    // Parse WKT format: POLYGON((lng lat, lng lat, ...))
    const coordString = wkt.match(/\(\((.*?)\)\)/)?.[1]
    if (!coordString) return []

    const coords = coordString.split(',').map((pair: string) => {
      const [lng, lat] = pair.trim().split(' ').map(Number)
      return { latitude: lat, longitude: lng }
    })

    // Remove last coordinate if it's duplicate of first (closing the polygon)
    if (coords.length > 1 &&
        coords[0].latitude === coords[coords.length - 1].latitude &&
        coords[0].longitude === coords[coords.length - 1].longitude) {
      coords.pop()
    }

    return coords
  }

  const convertBoundaryToWKT = (coords: Coordinate[]): string | null => {
    if (coords.length < 3) return null

    // WKT format: POLYGON((lng lat, lng lat, ...))
    // Need to close the polygon by repeating first point at the end
    const coordStrings = coords.map(c => `${c.longitude} ${c.latitude}`)
    coordStrings.push(coordStrings[0]) // Close the polygon
    return `POLYGON((${coordStrings.join(', ')}))`
  }

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadGardenData()
      }
    }, [id])
  )

  const loadGardenData = async () => {
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
        setSelectedSiteId(gardenData.site_id || null)
        setLocationLat(gardenData.location_lat || null)
        setLocationLng(gardenData.location_lng || null)

        // Parse boundary if it exists
        if (gardenData.boundary) {
          const parsedBoundary = parseBoundaryFromWKT(gardenData.boundary)
          setBoundary(parsedBoundary)
          setInitialBoundary(parsedBoundary)
        }

        // Set initial location for map
        if (gardenData.location_lat && gardenData.location_lng) {
          setInitialLocation({
            latitude: gardenData.location_lat,
            longitude: gardenData.location_lng
          })
        }
      }
    } catch (error) {
      console.error('Error loading garden:', error)
      alert('Failed to load garden details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateGarden = async () => {
    if (!name.trim()) {
      alert('Please enter a garden name')
      return
    }

    setIsSaving(true)
    try {
      const boundaryWKT = convertBoundaryToWKT(boundary)
      const { error } = await supabase
        .from('gardens')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          location_description: location.trim() || null,
          garden_type: gardenType,
          site_id: selectedSiteId || null,
          location_lat: locationLat,
          location_lng: locationLng,
          boundary: boundaryWKT,
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
                    onPress={handleUpdateGarden}
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
                initialLocation={initialLocation}
                initialBoundary={initialBoundary}
              />
            )}
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </KeyboardAvoidingView>
  )
}
