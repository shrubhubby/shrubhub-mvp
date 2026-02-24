import React from 'react'
import { View, Text } from 'react-native'
import { MemberCard } from './MemberCard'

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

interface MemberListProps {
  members: Member[]
  currentUserGardenerId: string
  currentUserRole: Role
  onRemoveMember: (memberId: string) => void
  onChangeRole: (memberId: string, newRole: Role) => void
}

export function MemberList({
  members,
  currentUserGardenerId,
  currentUserRole,
  onRemoveMember,
  onChangeRole,
}: MemberListProps) {
  // Sort members: owner first, then by role, then by name
  const roleOrder: Record<Role, number> = { owner: 0, admin: 1, editor: 2, viewer: 3 }
  const sortedMembers = [...members].sort((a, b) => {
    const roleCompare = roleOrder[a.role] - roleOrder[b.role]
    if (roleCompare !== 0) return roleCompare
    return a.gardener.display_name.localeCompare(b.gardener.display_name)
  })

  if (members.length === 0) {
    return (
      <View className="py-8">
        <Text className="text-center text-coal/60">No members found</Text>
      </View>
    )
  }

  return (
    <View className="gap-3">
      {sortedMembers.map(member => (
        <MemberCard
          key={member.id}
          member={member}
          currentUserRole={currentUserRole}
          isCurrentUser={member.gardener_id === currentUserGardenerId}
          onRemove={onRemoveMember}
          onChangeRole={onChangeRole}
        />
      ))}
    </View>
  )
}
