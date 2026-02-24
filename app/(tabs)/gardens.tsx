import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { Link, useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { RoleBadge } from '@/components/garden'

type Role = 'owner' | 'admin' | 'editor' | 'viewer'

interface GardenWithRole {
  id: string
  name: string
  description: string | null
  garden_type: string | null
  location_description: string | null
  is_primary: boolean
  role: Role
}

export default function GardensScreen() {
  const router = useRouter()
  const [gardens, setGardens] = useState<GardenWithRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [plantCounts, setPlantCounts] = useState<Record<string, number>>({})

  useFocusEffect(
    useCallback(() => {
      loadGardens()
    }, [])
  )

  const loadGardens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/(auth)/login')
        return
      }

      // Get gardener
      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!gardener) {
        router.replace('/onboarding/setup-garden')
        return
      }

      // Get all gardens user is a member of (via garden_members)
      const { data: memberships } = await supabase
        .from('garden_members')
        .select(`
          role,
          garden:gardens (
            id,
            name,
            description,
            garden_type,
            location_description,
            is_primary,
            archived_at
          )
        `)
        .eq('gardener_id', gardener.id)

      // Filter out archived gardens and format data
      const gardensData: GardenWithRole[] = (memberships || [])
        .filter(m => m.garden && !(m.garden as any).archived_at)
        .map(m => ({
          ...(m.garden as any),
          role: m.role as Role,
        }))
        .sort((a, b) => {
          // Primary first, then by name
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          return a.name.localeCompare(b.name)
        })

      setGardens(gardensData)

      // Get plant counts for each garden
      if (gardensData && gardensData.length > 0) {
        const counts: Record<string, number> = {}
        for (const garden of gardensData) {
          const { count } = await supabase
            .from('plants')
            .select('*', { count: 'exact', head: true })
            .eq('garden_id', garden.id)
            .is('archived_at', null)

          counts[garden.id] = count || 0
        }
        setPlantCounts(counts)
      }
    } catch (error) {
      console.error('Error loading gardens:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetPrimary = async (gardenId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      // Unset all as primary
      await supabase
        .from('gardens')
        .update({ is_primary: false })
        .eq('gardener_id', gardener!.id)

      // Set selected as primary
      await supabase
        .from('gardens')
        .update({ is_primary: true })
        .eq('id', gardenId)

      loadGardens()
    } catch (error) {
      console.error('Error setting primary garden:', error)
    }
  }

  const getGardenTypeEmoji = (type: string) => {
    const emojiMap: Record<string, string> = {
      indoor: '🏠',
      outdoor: '🌳',
      container: '🪴',
      raised_bed: '📦',
      in_ground: '🌱',
      greenhouse: '🏡',
      community_plot: '👥',
      mixed: '🌿'
    }
    return emojiMap[type] || '🌱'
  }

  return (
    <View className="flex-1 bg-soft">
      <Header />

      <ScrollView className="flex-1" contentContainerClassName="pb-20">
        <View className="px-4 py-6 gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-coal">My Gardens</Text>
              <Text className="text-coal/60 mt-1">
                Manage your garden spaces
              </Text>
            </View>
            <Link href="/gardens/add" asChild>
              <Button variant="primary" size="sm">
                <Text className="text-white font-medium">+ Add Garden</Text>
              </Button>
            </Link>
          </View>

          {/* Gardens List */}
          {isLoading ? (
            <Text className="text-center text-coal/60">Loading...</Text>
          ) : gardens.length === 0 ? (
            <Card>
              <CardContent className="items-center py-12">
                <Text className="text-6xl mb-4">🌱</Text>
                <Text className="text-xl font-semibold text-coal mb-2">
                  No gardens yet
                </Text>
                <Text className="text-coal/60 text-center mb-4">
                  Create your first garden to start tracking plants
                </Text>
                <Link href="/onboarding/setup-garden" asChild>
                  <Button variant="primary">
                    <Text className="text-white font-medium">Create Garden</Text>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <View className="gap-4">
              {gardens.map((garden) => (
                <Card
                  key={garden.id}
                  onPress={() => router.push(`/gardens/${garden.id}`)}
                >
                  <CardHeader>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-2xl">{getGardenTypeEmoji(garden.garden_type || 'mixed')}</Text>
                          <Text className="text-xl font-semibold text-coal flex-1">
                            {garden.name}
                          </Text>
                        </View>
                        {garden.location_description && (
                          <Text className="text-sm text-coal/60 mt-1">
                            {garden.location_description}
                          </Text>
                        )}
                      </View>
                      <View className="items-end gap-1">
                        {garden.is_primary && (
                          <Badge variant="healthy">
                            <Text className="text-xs font-medium">Primary</Text>
                          </Badge>
                        )}
                        <RoleBadge role={garden.role} />
                      </View>
                    </View>
                  </CardHeader>
                  <CardContent className="gap-3">
                    {garden.description && (
                      <Text className="text-coal/80">{garden.description}</Text>
                    )}

                    {/* Stats */}
                    <View className="flex-row gap-4">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">🌱</Text>
                        <View>
                          <Text className="text-lg font-semibold text-coal">
                            {plantCounts[garden.id] || 0}
                          </Text>
                          <Text className="text-xs text-coal/60">Plants</Text>
                        </View>
                      </View>
                      {garden.garden_type && (
                        <View className="flex-row items-center gap-2">
                          <Text className="text-2xl">📋</Text>
                          <View>
                            <Text className="text-sm font-medium text-coal capitalize">
                              {garden.garden_type.replace('_', ' ')}
                            </Text>
                            <Text className="text-xs text-coal/60">Type</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Set Primary action - only for owners */}
                    {!garden.is_primary && garden.role === 'owner' && (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation()
                          handleSetPrimary(garden.id)
                        }}
                        className="self-start px-3 py-1 rounded-full bg-coal/5"
                      >
                        <Text className="text-xs text-coal">Set as Primary</Text>
                      </Pressable>
                    )}
                  </CardContent>
                </Card>
              ))}
            </View>
          )}

          {/* Info Card */}
          <Card>
            <CardContent>
              <Text className="text-sm text-coal/60">
                💡 <Text className="font-semibold">Note:</Text>{' '}The "primary" garden is shown by default on your dashboard. You can manage multiple gardens for different locations.
              </Text>
            </CardContent>
          </Card>

          {/* Future: Sites Section */}
          <Card>
            <CardHeader>
              <Text className="text-lg font-semibold text-coal">🏡 Sites (Coming Soon)</Text>
            </CardHeader>
            <CardContent>
              <Text className="text-sm text-coal/60">
                Sites will let you group gardens by location (e.g., "My House", "Community Garden"). Each site can have multiple gardens with shared weather and environmental data.
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}
