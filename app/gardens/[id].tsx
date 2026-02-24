import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PlantGrid } from '@/components/plant/PlantGrid'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { RoleBadge } from '@/components/garden'

type Role = 'owner' | 'admin' | 'editor' | 'viewer'

export default function GardenDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [garden, setGarden] = useState<any>(null)
  const [plants, setPlants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<Role | null>(null)
  const [memberCount, setMemberCount] = useState(0)

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadGardenDetails()
      }
    }, [id])
  )

  const loadGardenDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Get gardener ID
      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single()

      // Load garden
      const { data: gardenData } = await supabase
        .from('gardens')
        .select('*')
        .eq('id', id)
        .single()

      setGarden(gardenData)

      // Load user's role in this garden
      if (gardener && id) {
        const { data: membership } = await supabase
          .from('garden_members')
          .select('role')
          .eq('garden_id', id)
          .eq('gardener_id', gardener.id)
          .single()

        if (membership) {
          setUserRole(membership.role as Role)
        }

        // Get member count
        const { count } = await supabase
          .from('garden_members')
          .select('*', { count: 'exact', head: true })
          .eq('garden_id', id)

        setMemberCount(count || 0)
      }

      // Load plants in this garden
      if (gardenData) {
        const { data: plantsData } = await supabase
          .from('plants')
          .select(`
            *,
            plants_master (
              common_names,
              scientific_name
            )
          `)
          .eq('garden_id', gardenData.id)
          .is('archived_at', null)
          .order('created_at', { ascending: false })

        setPlants(plantsData || [])
      }
    } catch (error) {
      console.error('Error loading garden:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchiveGarden = async () => {
    if (!confirm('Are you sure you want to archive this garden? Plants will be preserved but the garden will be hidden.')) {
      return
    }

    try {
      await supabase
        .from('gardens')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)

      router.back()
    } catch (error) {
      console.error('Error archiving garden:', error)
      alert('Failed to archive garden')
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-soft">
        <Header showBack title="Garden Details" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-coal/60">Loading...</Text>
        </View>
      </View>
    )
  }

  if (!garden) {
    return (
      <View className="flex-1 bg-soft">
        <Header showBack title="Garden Details" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-coal/60">Garden not found</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-soft">
      <Header showBack title={garden.name} />

      <ScrollView className="flex-1" contentContainerClassName="pb-20">
        <View className="px-4 py-6 gap-6">
          {/* Garden Info */}
          <Card>
            <CardHeader>
              <Text className="text-2xl font-bold text-coal">{garden.name}</Text>
              {garden.location_description && (
                <Text className="text-coal/60 mt-1">📍 {garden.location_description}</Text>
              )}
            </CardHeader>
            <CardContent className="gap-4">
              {garden.description && (
                <Text className="text-coal/80">{garden.description}</Text>
              )}

              <View className="flex-row flex-wrap gap-4">
                <View>
                  <Text className="text-sm text-coal/60">Type</Text>
                  <Text className="text-base font-medium text-coal capitalize">
                    {garden.garden_type?.replace('_', ' ') || 'Mixed'}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm text-coal/60">Plants</Text>
                  <Text className="text-base font-medium text-coal">
                    {plants.length}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm text-coal/60">Status</Text>
                  <Text className="text-base font-medium text-forest">
                    {garden.is_primary ? 'Primary Garden' : 'Active'}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Plants in this Garden */}
          <View className="gap-4">
            <Text className="text-2xl font-semibold text-coal">Plants in this Garden</Text>
            <PlantGrid
              plants={plants}
              emptyMessage="No plants in this garden yet. Add your first plant!"
            />
          </View>

          {/* Members Section */}
          <Card onPress={() => router.push(`/gardens/${id}/members`)}>
            <CardContent className="py-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">👥</Text>
                  <View>
                    <Text className="text-base font-semibold text-coal">Members</Text>
                    <Text className="text-sm text-coal/60">
                      {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  {userRole && <RoleBadge role={userRole} />}
                  <Text className="text-coal/40">→</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="gap-3">
              <View className="flex-row gap-3">
                {(userRole === 'owner' || userRole === 'admin') && (
                  <Button
                    variant="primary"
                    onPress={() => router.push(`/gardens/${id}/edit`)}
                    className="flex-1"
                  >
                    <Text className="text-white font-medium">Edit Garden</Text>
                  </Button>
                )}
                {userRole === 'owner' && (
                  <Button
                    variant="outline"
                    onPress={handleArchiveGarden}
                    className="flex-1"
                  >
                    <Text className="text-coal font-medium">Archive</Text>
                  </Button>
                )}
              </View>
              {userRole === 'owner' && (
                <Text className="text-xs text-coal/60">
                  Archiving preserves plants but hides the garden from your active list
                </Text>
              )}
            </CardContent>
          </Card>

          {/* Future: Site Info */}
          <Card>
            <CardHeader>
              <Text className="text-lg font-semibold text-coal">🏡 Site Information (Coming Soon)</Text>
            </CardHeader>
            <CardContent>
              <Text className="text-sm text-coal/60">
                Site-level data like weather conditions, hardiness zone, and environmental sensors will appear here.
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}
