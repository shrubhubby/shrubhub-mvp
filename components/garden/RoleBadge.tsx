import React from 'react'
import { View, Text } from 'react-native'

type Role = 'owner' | 'admin' | 'editor' | 'viewer'

interface RoleBadgeProps {
  role: Role
  size?: 'sm' | 'md'
}

const roleConfig: Record<Role, { label: string; bgColor: string; textColor: string }> = {
  owner: { label: 'Owner', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  admin: { label: 'Admin', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  editor: { label: 'Editor', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  viewer: { label: 'Viewer', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
}

export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const config = roleConfig[role]
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <View className={`rounded-full ${config.bgColor} ${sizeClasses}`}>
      <Text className={`font-medium ${config.textColor}`}>
        {config.label}
      </Text>
    </View>
  )
}
