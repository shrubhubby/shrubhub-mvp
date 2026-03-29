import React, { useState, useEffect } from 'react'
import { View, Text, Modal, Pressable, ScrollView } from 'react-native'
import { Card, CardContent } from '@/components/ui/Card'
import { RoleBadge } from './RoleBadge'
import { supabase } from '@/lib/supabase/client'

type Role = 'owner' | 'admin' | 'editor' | 'viewer'

interface Garden {
  id: string
  name: string
  role: Role
}

interface GardenSwitcherProps {
  currentGardenId: string
  currentGardenName: string
  onSelectGarden: (gardenId: string) => void
}

export function GardenSwitcher({
  currentGardenId,
  currentGardenName,
  onSelectGarden,
}: GardenSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [gardens, setGardens] = useState<Garden[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadGardens = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!gardener) return

      const { data: memberships } = await supabase
        .from('garden_members')
        .select(`
          role,
          garden:gardens (
            id,
            name
          )
        `)
        .eq('gardener_id', gardener.id)

      if (memberships) {
        const gardenList = memberships
          .filter(m => m.garden)
          .map(m => ({
            id: (m.garden as any).id,
            name: (m.garden as any).name,
            role: m.role as Role,
          }))
        setGardens(gardenList)
      }
    } catch (error) {
      console.error('Error loading gardens:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadGardens()
    }
  }, [isOpen])

  const handleSelectGarden = (gardenId: string) => {
    setIsOpen(false)
    if (gardenId !== currentGardenId) {
      onSelectGarden(gardenId)
    }
  }

  // Only show if user has multiple gardens
  if (gardens.length <= 1 && !isOpen) {
    return null
  }

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center gap-1 px-2 py-1 rounded-lg bg-forest/10"
      >
        <Text className="text-sm font-medium text-forest" numberOfLines={1}>
          {currentGardenName}
        </Text>
        <Text className="text-forest">▼</Text>
      </Pressable>

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 bg-soft">
          <View className="flex-row items-center justify-between p-4 bg-white border-b border-soft">
            <Text className="text-lg font-semibold text-coal">Switch Garden</Text>
            <Pressable onPress={() => setIsOpen(false)}>
              <Text className="text-forest">Done</Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            {isLoading ? (
              <Text className="text-center text-coal/60">Loading gardens...</Text>
            ) : (
              <View className="gap-3">
                {gardens.map(garden => (
                  <Card
                    key={garden.id}
                    onPress={() => handleSelectGarden(garden.id)}
                  >
                    <CardContent className="py-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-base font-semibold text-coal">
                              {garden.name}
                            </Text>
                            {garden.id === currentGardenId && (
                              <Text className="text-xs text-forest">✓ Current</Text>
                            )}
                          </View>
                        </View>
                        <RoleBadge role={garden.role} />
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}
