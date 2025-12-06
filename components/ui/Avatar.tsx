import React from 'react'
import { View, Image, Text } from 'react-native'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  }

  return (
    <View
      className={cn(
        'rounded-full bg-ocean-mist flex items-center justify-center overflow-hidden',
        sizes[size],
        className
      )}
    >
      {src ? (
        <Image
          source={{ uri: src }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <Text className={cn('text-ocean-mid', textSizes[size])}>👤</Text>
      )}
    </View>
  )
}
