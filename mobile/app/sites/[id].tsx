import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

const HARDINESS_ZONES = [
  '1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b', '5a', '5b',
  '6a', '6b', '7a', '7b', '8a', '8b', '9a', '9b', '10a', '10b',
  '11a', '11b', '12a', '12b', '13a', '13b'
]

export default function SiteDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [site, setSite] = useState<any>(null)
  const [gardens, setGardens] = useState<any[]>([])
  const [nearbyGardens, setNearbyGardens] = useState<any[]>([])
  const [unassignedGardens, setUnassignedGardens] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [locationDescription, setLocationDescription] = useState('')
  const [hardinessZone, setHardinessZone] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadSiteDetails()
      }
    }, [id])
  )

  const loadSiteDetails = async () => {
    try {
      // Load site
      const { data: siteData } = await supabase
        .from('sites')
        .select('*')
        .eq('id', id)
        .single()

      if (siteData) {
        setSite(siteData)
        setName(siteData.name || '')
        setLocationDescription(siteData.location_description || '')
        setHardinessZone(siteData.hardiness_zone || '')
        setTimezone(siteData.timezone || 'America/New_York')
      }

      // Load gardens at this site
      if (siteData) {
        const { data: gardensData } = await supabase
          .from('gardens')
          .select('*')
          .eq('site_id', siteData.id)
          .is('archived_at', null)
          .order('created_at', { ascending: false })

        setGardens(gardensData || [])

        // Load all unassigned gardens for "Add Existing Garden" feature
        const { data: unassignedData } = await supabase
          .from('gardens')
          .select('*')
          .is('site_id', null)
          .is('archived_at', null)
          .order('name')

        setUnassignedGardens(unassignedData || [])

        // Load nearby gardens - gardens without site_id that are geographically close
        // For now, use a simple distance check if location data is available
        if (siteData.location_lat && siteData.location_lng && unassignedData) {
          const nearby = unassignedData.filter((garden: any) => {
            if (!garden.location_lat || !garden.location_lng) return false

            // Simple distance calculation (rough approximation in degrees)
            // 0.01 degrees is roughly 1km
            const latDiff = Math.abs(garden.location_lat - siteData.location_lat)
            const lngDiff = Math.abs(garden.location_lng - siteData.location_lng)
            const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)

            // Consider "nearby" if within ~5km (0.05 degrees)
            return distance < 0.05
          })
          setNearbyGardens(nearby)
        }
      }
    } catch (error) {
      console.error('Error loading site:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddGardenToSite = async (gardenId: string) => {
    try {
      const { error } = await supabase
        .from('gardens')
        .update({ site_id: id })
        .eq('id', gardenId)

      if (error) throw error

      loadSiteDetails()
    } catch (error) {
      console.error('Error adding garden to site:', error)
      alert('Failed to add garden to site')
    }
  }

  const handleRemoveGardenFromSite = async (gardenId: string) => {
    if (!confirm('Remove this garden from the site? The garden will not be deleted.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('gardens')
        .update({ site_id: null })
        .eq('id', gardenId)

      if (error) throw error

      loadSiteDetails()
    } catch (error) {
      console.error('Error removing garden from site:', error)
      alert('Failed to remove garden from site')
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a site name')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('sites')
        .update({
          name: name.trim(),
          location_description: locationDescription.trim() || null,
          hardiness_zone: hardinessZone || null,
          timezone: timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      setIsEditing(false)
      loadSiteDetails()
    } catch (error) {
      console.error('Error updating site:', error)
      alert('Failed to update site. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this site? Gardens will not be deleted, but they will be unassigned from this site.')) {
      return
    }

    try {
      // Unassign gardens from this site
      await supabase
        .from('gardens')
        .update({ site_id: null })
        .eq('site_id', id)

      // Delete the site
      await supabase
        .from('sites')
        .delete()
        .eq('id', id)

      router.back()
    } catch (error) {
      console.error('Error deleting site:', error)
      alert('Failed to delete site')
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-soft">
        <Header showBack title="Site Details" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-coal/60">Loading...</Text>
        </View>
      </View>
    )
  }

  if (!site) {
    return (
      <View className="flex-1 bg-soft">
        <Header showBack title="Site Details" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-coal/60">Site not found</Text>
        </View>
      </View>
    )
  }

  if (isEditing) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-soft">
          <Header showBack title="Edit Site" />

          <ScrollView className="flex-1" contentContainerClassName="pb-20">
            <View className="px-4 py-6 gap-6 max-w-4xl">
              <Card>
                <CardContent className="gap-4">
                  <Input
                    label="Site Name *"
                    placeholder="e.g., My House, Community Garden"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />

                  <Input
                    label="Location Description"
                    placeholder="e.g., 123 Main St, Backyard"
                    value={locationDescription}
                    onChangeText={setLocationDescription}
                    autoCapitalize="words"
                  />

                  {/* Hardiness Zone Selection */}
                  <View>
                    <Text className="text-sm font-medium text-coal mb-2">
                      USDA Hardiness Zone (Optional)
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="flex-row gap-2 -mx-4 px-4"
                    >
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
                    </ScrollView>
                  </View>

                  {/* Timezone */}
                  <Input
                    label="Timezone"
                    placeholder="e.g., America/New_York"
                    value={timezone}
                    onChangeText={setTimezone}
                    autoCapitalize="none"
                  />

                  <View className="flex-row gap-3 mt-2">
                    <Button
                      variant="outline"
                      onPress={() => setIsEditing(false)}
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
            </View>
          </ScrollView>

          <BottomNav />
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <View className="flex-1 bg-soft">
      <Header showBack title={site.name} />

      <ScrollView className="flex-1" contentContainerClassName="pb-20">
        <View className="px-4 py-6 gap-6">
          {/* Site Info */}
          <Card>
            <CardHeader>
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-coal">🏡 {site.name}</Text>
                  {site.location_description && (
                    <Text className="text-coal/60 mt-1">📍 {site.location_description}</Text>
                  )}
                </View>
                <View className="flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => setIsEditing(true)}
                  >
                    <Text className="text-coal font-medium text-xs">✏️ Edit</Text>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={handleDelete}
                  >
                    <Text className="text-coal font-medium text-xs">🗑️ Delete</Text>
                  </Button>
                </View>
              </View>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="flex-row flex-wrap gap-4">
                {site.hardiness_zone && (
                  <View>
                    <Text className="text-sm text-coal/60">Hardiness Zone</Text>
                    <Text className="text-base font-medium text-coal">
                      Zone {site.hardiness_zone}
                    </Text>
                  </View>
                )}
                <View>
                  <Text className="text-sm text-coal/60">Timezone</Text>
                  <Text className="text-base font-medium text-coal">
                    {site.timezone}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm text-coal/60">Gardens</Text>
                  <Text className="text-base font-medium text-coal">
                    {gardens.length}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Gardens at this Site */}
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-semibold text-coal">Gardens at this Site</Text>
              <View className="flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => router.push('/gardens/add')}
                >
                  <Text className="text-coal font-medium text-xs">+ New Garden</Text>
                </Button>
              </View>
            </View>

            {gardens.length === 0 ? (
              <Card>
                <CardContent className="items-center py-8 gap-3">
                  <Text className="text-4xl mb-2">🌱</Text>
                  <Text className="text-coal/60 text-center">
                    No gardens assigned to this site yet
                  </Text>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => router.push('/gardens/add')}
                  >
                    <Text className="text-white font-medium">Create First Garden</Text>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              gardens.map((garden) => (
                <Card key={garden.id}>
                  <CardHeader>
                    <Text className="text-lg font-semibold text-coal">
                      {garden.name}
                    </Text>
                    {garden.location_description && (
                      <Text className="text-sm text-coal/60 mt-1">
                        📍 {garden.location_description}
                      </Text>
                    )}
                  </CardHeader>
                  <CardContent className="gap-2">
                    <View className="flex-row gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={() => router.push(`/gardens/${garden.id}`)}
                        className="flex-1"
                      >
                        <Text className="text-white font-medium text-xs">View Garden</Text>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => handleRemoveGardenFromSite(garden.id)}
                      >
                        <Text className="text-coal font-medium text-xs">Remove</Text>
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>

          {/* Nearby Gardens */}
          {nearbyGardens.length > 0 && (
            <View className="gap-4">
              <Text className="text-2xl font-semibold text-coal">Nearby Gardens</Text>
              <Card>
                <CardContent className="gap-2">
                  <Text className="text-xs text-coal/60 mb-2">
                    These unassigned gardens are geographically near this site. Add them to track all your gardens at this location together.
                  </Text>
                  {nearbyGardens.map((garden) => (
                    <View key={garden.id} className="flex-row items-center justify-between py-2 border-t border-coal/10">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-coal">
                          {garden.name}
                        </Text>
                        {garden.location_description && (
                          <Text className="text-xs text-coal/60">
                            📍 {garden.location_description}
                          </Text>
                        )}
                      </View>
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={() => handleAddGardenToSite(garden.id)}
                      >
                        <Text className="text-white font-medium text-xs">Add to Site</Text>
                      </Button>
                    </View>
                  ))}
                </CardContent>
              </Card>
            </View>
          )}

          {/* All Unassigned Gardens */}
          {unassignedGardens.length > 0 && nearbyGardens.length === 0 && (
            <View className="gap-4">
              <Text className="text-xl font-semibold text-coal">Add Existing Garden</Text>
              <Card>
                <CardContent className="gap-2">
                  <Text className="text-xs text-coal/60 mb-2">
                    Select an unassigned garden to add it to this site
                  </Text>
                  {unassignedGardens.map((garden) => (
                    <View key={garden.id} className="flex-row items-center justify-between py-2 border-t border-coal/10">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-coal">
                          {garden.name}
                        </Text>
                        {garden.location_description && (
                          <Text className="text-xs text-coal/60">
                            📍 {garden.location_description}
                          </Text>
                        )}
                      </View>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => handleAddGardenToSite(garden.id)}
                      >
                        <Text className="text-coal font-medium text-xs">Add</Text>
                      </Button>
                    </View>
                  ))}
                </CardContent>
              </Card>
            </View>
          )}

          {/* Future: Weather & Environmental Data */}
          <Card>
            <CardHeader>
              <Text className="text-lg font-semibold text-coal">🌤️ Weather & Environment (Coming Soon)</Text>
            </CardHeader>
            <CardContent>
              <Text className="text-sm text-coal/60">
                Site-level weather tracking, frost dates, and environmental sensor data will appear here.
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}
