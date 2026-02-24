import React from 'react'
import { View, Text, Pressable, Alert } from 'react-native'
import { Card, CardContent } from '@/components/ui/Card'
import { RoleBadge } from './RoleBadge'

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

interface MemberCardProps {
  member: Member
  currentUserRole: Role
  onRemove?: (memberId: string) => void
  onChangeRole?: (memberId: string, newRole: Role) => void
  isCurrentUser?: boolean
}

export function MemberCard({
  member,
  currentUserRole,
  onRemove,
  onChangeRole,
  isCurrentUser,
}: MemberCardProps) {
  const canManage = currentUserRole === 'owner' ||
    (currentUserRole === 'admin' && member.role !== 'owner' && member.role !== 'admin')

  const canChangeRole = currentUserRole === 'owner' && member.role !== 'owner'

  const handleRemove = () => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.gardener.display_name} from the garden?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove?.(member.id)
        },
      ]
    )
  }

  const handleRoleChange = () => {
    const roles: Role[] = ['admin', 'editor', 'viewer']
    const currentIndex = roles.indexOf(member.role)

    Alert.alert(
      'Change Role',
      `Select a new role for ${member.gardener.display_name}`,
      [
        ...roles.map(role => ({
          text: role.charAt(0).toUpperCase() + role.slice(1),
          onPress: () => onChangeRole?.(member.id, role),
          style: role === member.role ? 'cancel' as const : 'default' as const,
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  return (
    <Card>
      <CardContent className="py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-semibold text-coal">
                {member.gardener.display_name}
              </Text>
              {isCurrentUser && (
                <Text className="text-xs text-coal/40">(You)</Text>
              )}
            </View>
            <Text className="text-sm text-coal/60">{member.gardener.email}</Text>
            <Text className="text-xs text-coal/40 mt-1">
              Joined {new Date(member.joined_at).toLocaleDateString()}
            </Text>
          </View>

          <View className="items-end gap-2">
            <RoleBadge role={member.role} />

            {!isCurrentUser && (canManage || canChangeRole) && (
              <View className="flex-row gap-2">
                {canChangeRole && (
                  <Pressable
                    onPress={handleRoleChange}
                    className="px-2 py-1 rounded bg-coal/5"
                  >
                    <Text className="text-xs text-coal">Change Role</Text>
                  </Pressable>
                )}
                {canManage && (
                  <Pressable
                    onPress={handleRemove}
                    className="px-2 py-1 rounded bg-red-50"
                  >
                    <Text className="text-xs text-red-600">Remove</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </CardContent>
    </Card>
  )
}
