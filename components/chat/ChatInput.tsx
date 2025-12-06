import React, { useState } from 'react'
import { View, TextInput, Pressable, Text, Platform } from 'react-native'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = 'Ask me anything about your plants...'
}: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!message.trim() || isLoading) return

    onSend(message.trim())
    setMessage('')
  }

  return (
    <View className="bg-white border-t border-soft/50 p-4">
      <View className="flex-row gap-2 items-end">
        <View className="flex-1">
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor="#33333366"
            editable={!isLoading}
            multiline
            maxLength={500}
            className={cn(
              'w-full px-4 py-3 rounded-2xl border border-soft bg-soft/50 text-coal max-h-32',
              Platform.OS === 'ios' && 'min-h-[44px]'
            )}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
        </View>

        <Pressable
          onPress={handleSend}
          disabled={!message.trim() || isLoading}
          className={cn(
            'rounded-full w-12 h-12 items-center justify-center',
            message.trim() && !isLoading ? 'bg-forest' : 'bg-soft'
          )}
        >
          <Text className={cn('text-xl', message.trim() && !isLoading ? 'text-white' : 'text-coal/40')}>
            {isLoading ? '⏳' : '📤'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
