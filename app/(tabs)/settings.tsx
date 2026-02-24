import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Pressable, Alert } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { RoleBadge, InviteModal } from '@/components/garden'

type Role = 'owner' | 'admin' | 'editor' | 'viewer'

interface Garden {
  id: string
  name: string
}

export default function SettingsScreen() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [displayName, setDisplayName] = useState('Gardener')
  const [ownedGardens, setOwnedGardens] = useState<Garden[]>([])
  const [selectedGardenForInvite, setSelectedGardenForInvite] = useState<Garden | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useFocusEffect(
    useCallback(() => {
      loadUserData()
    }, [])
  )

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email || '')

      // Get gardener
      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id, display_name')
        .eq('auth_user_id', user.id)
        .single()

      if (gardener) {
        setDisplayName(gardener.display_name || 'Gardener')

        // Get gardens where user is owner or admin (can invite)
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
          .in('role', ['owner', 'admin'])

        if (memberships) {
          const gardens = memberships
            .filter(m => m.garden)
            .map(m => m.garden as unknown as Garden)
          setOwnedGardens(gardens)
        }
      }
    }
  }

  const handleInvite = (garden: Garden) => {
    setSelectedGardenForInvite(garden)
    setShowInviteModal(true)
  }

  const handleLogout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    router.replace('/(auth)/login')
  }

  return (
    <View className="flex-1 bg-soft">
      <Header />

      <ScrollView className="flex-1" contentContainerClassName="pb-20">
        <View className="px-4 py-6 gap-6 max-w-4xl">
          <View>
            <Text className="text-3xl font-bold text-coal">Settings</Text>
            <Text className="text-coal/60 mt-1">
              Manage your account and preferences
            </Text>
          </View>

          {/* Profile settings */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">👤</Text>
                <Text className="text-xl font-semibold text-coal">Profile</Text>
              </View>
            </CardHeader>
            <CardContent className="gap-4">
              <Input
                label="Display Name"
                placeholder="Your name"
                value={displayName}
                onChangeText={setDisplayName}
              />
              <Input
                label="Email"
                placeholder="your@email.com"
                value={userEmail}
                editable={false}
              />
              <Button variant="primary">Save Changes</Button>
            </CardContent>
          </Card>

          {/* Members & Invites */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">👥</Text>
                <Text className="text-xl font-semibold text-coal">Members & Invites</Text>
              </View>
            </CardHeader>
            <CardContent className="gap-4">
              <Text className="text-sm text-coal/60">
                Invite family or friends to help manage your gardens
              </Text>

              {ownedGardens.length === 0 ? (
                <Text className="text-sm text-coal/40">
                  No gardens available for inviting members
                </Text>
              ) : (
                <View className="gap-2">
                  {ownedGardens.map(garden => (
                    <Pressable
                      key={garden.id}
                      onPress={() => handleInvite(garden)}
                      className="flex-row items-center justify-between p-3 bg-soft rounded-lg"
                    >
                      <Text className="font-medium text-coal">{garden.name}</Text>
                      <Text className="text-sm text-forest">Invite +</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Join a garden */}
              <Pressable
                onPress={() => router.push('/invite')}
                className="flex-row items-center justify-between p-3 bg-forest/10 rounded-lg"
              >
                <View>
                  <Text className="font-medium text-forest">Join a Garden</Text>
                  <Text className="text-xs text-coal/60">Enter an invite code</Text>
                </View>
                <Text className="text-forest">→</Text>
              </Pressable>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">🔔</Text>
                <Text className="text-xl font-semibold text-coal">Notifications</Text>
              </View>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-medium text-coal">Watering Reminders</Text>
                  <Text className="text-sm text-coal/60">
                    Get notified when your plants need water
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card>
            <CardContent>
              <Button
                variant="outline"
                onPress={handleLogout}
                disabled={isLoading}
                className="w-full"
              >
                <Text className="text-coal font-medium">
                  {isLoading ? 'Logging out...' : '🚪 Logout'}
                </Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      <BottomNav />

      {/* Invite Modal */}
      {selectedGardenForInvite && (
        <InviteModal
          visible={showInviteModal}
          onClose={() => {
            setShowInviteModal(false)
            setSelectedGardenForInvite(null)
          }}
          gardenId={selectedGardenForInvite.id}
          gardenName={selectedGardenForInvite.name}
        />
      )}
    </View>
  )
}
