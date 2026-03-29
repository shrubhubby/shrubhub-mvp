import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native'
import { useLocalSearchParams, useFocusEffect } from 'expo-router'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { MemberList, InviteModal } from '@/components/garden'
import { supabase } from '@/lib/supabase/client'

type Role = 'owner' | 'admin' | 'editor' | 'viewer'

interface Member {
  id: string
  gardener_id: string
  role: Role
  joined_at: string
  gardener: {
    display_name: string
    email: string
  }
}

export default function GardenMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [garden, setGarden] = useState<{ name: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [currentUserGardenerId, setCurrentUserGardenerId] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<Role>('viewer')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current user's gardener ID
      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (gardener) {
        setCurrentUserGardenerId(gardener.id)
      }

      // Get garden info
      const { data: gardenData } = await supabase
        .from('gardens')
        .select('name')
        .eq('id', id)
        .single()

      if (gardenData) {
        setGarden(gardenData)
      }

      // Get all members
      const { data: membersData } = await supabase
        .from('garden_members')
        .select(`
          id,
          gardener_id,
          role,
          joined_at,
          gardener:gardeners (
            display_name,
            email
          )
        `)
        .eq('garden_id', id)

      if (membersData) {
        const formattedMembers = membersData.map(m => ({
          id: m.id,
          gardener_id: m.gardener_id,
          role: m.role as Role,
          joined_at: m.joined_at,
          gardener: {
            display_name: (m.gardener as any)?.display_name || 'Unknown',
            email: (m.gardener as any)?.email || '',
          }
        }))
        setMembers(formattedMembers)

        // Find current user's role
        const currentMember = formattedMembers.find(m => m.gardener_id === gardener?.id)
        if (currentMember) {
          setCurrentUserRole(currentMember.role)
        }
      }
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadData()
      }
    }, [id])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [id])

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/remove-member`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            garden_id: id,
            member_id: memberId,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member')
      }

      Alert.alert('Success', 'Member removed from garden')
      loadData()
    } catch (error) {
      console.error('Error removing member:', error)
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to remove member')
    }
  }

  const handleChangeRole = async (memberId: string, newRole: Role) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/update-member-role`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            garden_id: id,
            member_id: memberId,
            new_role: newRole,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role')
      }

      Alert.alert('Success', 'Member role updated')
      loadData()
    } catch (error) {
      console.error('Error updating role:', error)
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update role')
    }
  }

  const canInvite = currentUserRole === 'owner' || currentUserRole === 'admin'

  return (
    <View className="flex-1 bg-soft">
      <Header title="Garden Members" showBack />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="gap-4">
          {/* Header with invite button */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-coal">Members</Text>
              <Text className="text-sm text-coal/60">
                {members.length} member{members.length !== 1 ? 's' : ''} in {garden?.name}
              </Text>
            </View>
            {canInvite && (
              <Button
                variant="primary"
                onPress={() => setShowInviteModal(true)}
              >
                <Text className="text-white font-medium">+ Invite</Text>
              </Button>
            )}
          </View>

          {/* Member List */}
          {isLoading ? (
            <View className="py-8">
              <Text className="text-center text-coal/50">Loading members...</Text>
            </View>
          ) : (
            <MemberList
              members={members}
              currentUserGardenerId={currentUserGardenerId}
              currentUserRole={currentUserRole}
              onRemoveMember={handleRemoveMember}
              onChangeRole={handleChangeRole}
            />
          )}

          {/* Role Descriptions */}
          <View className="mt-4 p-4 bg-white rounded-lg border border-soft">
            <Text className="text-sm font-medium text-coal mb-2">Role Permissions</Text>
            <View className="gap-1">
              <Text className="text-xs text-coal/60">
                <Text className="font-medium">Owner:</Text> Full control, can delete garden
              </Text>
              <Text className="text-xs text-coal/60">
                <Text className="font-medium">Admin:</Text> Manage members and settings
              </Text>
              <Text className="text-xs text-coal/60">
                <Text className="font-medium">Editor:</Text> Add and edit plants
              </Text>
              <Text className="text-xs text-coal/60">
                <Text className="font-medium">Viewer:</Text> View only access
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Invite Modal */}
      {id && garden && (
        <InviteModal
          visible={showInviteModal}
          onClose={() => {
            setShowInviteModal(false)
            loadData()
          }}
          gardenId={id}
          gardenName={garden.name}
        />
      )}
    </View>
  )
}
