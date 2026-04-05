import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase/client'

// Built-in acquisition methods - prominently displayed
export const BUILT_IN_METHODS = [
  {
    value: 'propagation',
    label: 'Clone/Cutting',
    emoji: '✂️',
    description: 'From a mother plant you own',
    route: '/plants/register/bulk-clones',
  },
  {
    value: 'field_extraction',
    label: 'Field Extraction',
    emoji: '🌿',
    description: 'Collected from the wild',
    route: '/plants/register/field-extraction',
  },
  {
    value: 'mature_purchased',
    label: 'Purchased',
    emoji: '🛒',
    description: 'Bought from store/nursery',
    route: '/plants/register/purchase',
  },
  {
    value: 'seedling_purchased',
    label: 'Seedling',
    emoji: '🌱',
    description: 'Bought as a seedling',
    route: '/plants/register/purchase',
  },
  {
    value: 'gift',
    label: 'Gift',
    emoji: '🎁',
    description: 'Received as a gift',
    route: '/plants/register/gift',
  },
  {
    value: 'shrubhub_exchange',
    label: 'ShrubHub Exchange',
    emoji: '🔄',
    description: 'From community exchange',
    route: '/plants/register/exchange',
  },
  {
    value: 'seed',
    label: 'Seed',
    emoji: '🫘',
    description: 'Started from seed',
    route: '/plants/register/seed',
  },
  {
    value: 'unknown',
    label: 'Inventory Existing',
    emoji: '📋',
    description: 'Catalog plants already in your garden',
    route: '/plants/register/inventory',
  },
  {
    value: 'volunteer',
    label: 'Volunteer',
    emoji: '🌻',
    description: 'Self-seeded/appeared',
    route: '/plants/register/volunteer',
  },
] as const

export type AcquisitionMethod = typeof BUILT_IN_METHODS[number]['value'] | 'user_defined'

interface UserAcquisitionSource {
  id: string
  name: string
  description: string | null
  usage_count: number
}

interface AcquisitionMethodPickerProps {
  onSelect: (method: AcquisitionMethod, route: string, userSourceId?: string) => void
  gardenerId?: string
}

export function AcquisitionMethodPicker({
  onSelect,
  gardenerId,
}: AcquisitionMethodPickerProps) {
  const [showUserSources, setShowUserSources] = useState(false)
  const [userSources, setUserSources] = useState<UserAcquisitionSource[]>([])
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [newSourceName, setNewSourceName] = useState('')
  const [newSourceDescription, setNewSourceDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Load user-defined sources
  useEffect(() => {
    if (gardenerId && showUserSources) {
      loadUserSources()
    }
  }, [gardenerId, showUserSources])

  const loadUserSources = async () => {
    if (!gardenerId) return

    const { data, error } = await supabase
      .from('user_acquisition_sources')
      .select('*')
      .eq('gardener_id', gardenerId)
      .order('usage_count', { ascending: false })

    if (!error && data) {
      setUserSources(data)
    }
  }

  const handleCreateNewSource = async () => {
    if (!gardenerId || !newSourceName.trim()) return

    setIsCreating(true)
    try {
      const { data, error } = await supabase
        .from('user_acquisition_sources')
        .insert({
          gardener_id: gardenerId,
          name: newSourceName.trim(),
          description: newSourceDescription.trim() || null,
        })
        .select()
        .single()

      if (error) throw error

      // Add to list and select it
      setUserSources([data, ...userSources])
      setNewSourceName('')
      setNewSourceDescription('')
      setShowCreateNew(false)
      onSelect('user_defined', '/plants/register/custom', data.id)
    } catch (error) {
      alert('Failed to create acquisition source')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectUserSource = (source: UserAcquisitionSource) => {
    onSelect('user_defined', '/plants/register/custom', source.id)
  }

  return (
    <ScrollView className="flex-1">
      <View className="px-4 py-6 gap-4">
        {/* Header */}
        <View className="mb-2">
          <Text className="text-xl font-bold text-coal">How did you acquire this plant?</Text>
          <Text className="text-sm text-coal/60 mt-1">
            Choose the method to help track your plant's history
          </Text>
        </View>

        {/* Built-in methods - prominently displayed */}
        <View className="gap-3">
          {BUILT_IN_METHODS.map((method) => (
            <Pressable
              key={method.value}
              onPress={() => onSelect(method.value, method.route)}
              className="active:opacity-80"
            >
              <Card>
                <CardContent className="flex-row items-center gap-4 py-4">
                  <Text className="text-3xl">{method.emoji}</Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-coal text-base">{method.label}</Text>
                    <Text className="text-sm text-coal/60">{method.description}</Text>
                  </View>
                  <Text className="text-forest text-lg">→</Text>
                </CardContent>
              </Card>
            </Pressable>
          ))}
        </View>

        {/* User-defined sources section - downplayed */}
        <View className="mt-4 pt-4 border-t border-soft">
          <Pressable
            onPress={() => setShowUserSources(!showUserSources)}
            className="flex-row items-center justify-between py-2"
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-coal/50 text-sm">Other...</Text>
              {userSources.length > 0 && (
                <Text className="text-xs text-coal/40">
                  ({userSources.length} custom source{userSources.length !== 1 ? 's' : ''})
                </Text>
              )}
            </View>
            <Text className="text-coal/40">{showUserSources ? '▼' : '▶'}</Text>
          </Pressable>

          {showUserSources && (
            <View className="mt-2 gap-2">
              {/* Existing user sources */}
              {userSources.map((source) => (
                <Pressable
                  key={source.id}
                  onPress={() => handleSelectUserSource(source)}
                  className="active:opacity-80"
                >
                  <View className="bg-soft rounded-lg p-3 flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-medium text-coal">{source.name}</Text>
                      {source.description && (
                        <Text className="text-xs text-coal/60">{source.description}</Text>
                      )}
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs text-coal/40">
                        used {source.usage_count}x
                      </Text>
                      <Text className="text-forest">→</Text>
                    </View>
                  </View>
                </Pressable>
              ))}

              {/* Create new source - very downplayed */}
              {!showCreateNew ? (
                <Pressable
                  onPress={() => setShowCreateNew(true)}
                  className="py-2"
                >
                  <Text className="text-xs text-coal/40 text-center">
                    + Create new source (only if none above apply)
                  </Text>
                </Pressable>
              ) : (
                <Card className="mt-2">
                  <CardContent className="gap-3">
                    <Text className="text-sm font-medium text-coal">
                      Create Custom Acquisition Source
                    </Text>
                    <Text className="text-xs text-coal/60 -mt-2">
                      Check if one of the options above works first!
                    </Text>

                    <Input
                      label="Source Name"
                      placeholder="e.g., 'Local Plant Swap'"
                      value={newSourceName}
                      onChangeText={setNewSourceName}
                    />

                    <Input
                      label="Description (optional)"
                      placeholder="Brief description"
                      value={newSourceDescription}
                      onChangeText={setNewSourceDescription}
                    />

                    <View className="flex-row gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => {
                          setShowCreateNew(false)
                          setNewSourceName('')
                          setNewSourceDescription('')
                        }}
                        className="flex-1"
                      >
                        <Text className="text-coal">Cancel</Text>
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={handleCreateNewSource}
                        disabled={!newSourceName.trim() || isCreating}
                        className="flex-1"
                      >
                        <Text className="text-white">
                          {isCreating ? 'Creating...' : 'Create & Use'}
                        </Text>
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}
