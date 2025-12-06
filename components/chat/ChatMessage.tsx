import React from 'react'
import { View, Text } from 'react-native'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  userAvatar?: string | null
}

export function ChatMessage({ role, content, timestamp, userAvatar }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <View
      className={cn(
        'flex-row gap-3 mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <View className="flex-shrink-0">
        {isUser ? (
          <Avatar src={userAvatar} size="sm" />
        ) : (
          <View className="w-8 h-8 rounded-full bg-forest items-center justify-center">
            <Text className="text-white text-sm">🤖</Text>
          </View>
        )}
      </View>

      {/* Message content */}
      <View
        className={cn(
          'flex-col gap-1 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <View
          className={cn(
            'px-4 py-2 rounded-2xl',
            isUser
              ? 'bg-forest rounded-tr-sm'
              : 'bg-soft rounded-tl-sm'
          )}
        >
          <Text className={cn('text-sm leading-relaxed', isUser ? 'text-white' : 'text-coal')}>
            {content}
          </Text>
        </View>
        {timestamp && (
          <Text className="text-xs text-coal/50 px-2">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    </View>
  )
}
