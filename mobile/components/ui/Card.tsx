import React from 'react'
import { View, Pressable } from 'react-native'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  elevation?: 1 | 2 | 3
  onPress?: () => void
}

export function Card({ children, className, elevation = 1, onPress }: CardProps) {
  const elevations = {
    1: 'shadow-sm',
    2: 'shadow-md',
    3: 'shadow-lg'
  }

  const Component = onPress ? Pressable : View

  return (
    <Component
      onPress={onPress}
      className={cn(
        'bg-white rounded-xl border border-soft/50 overflow-hidden',
        elevations[elevation],
        onPress && 'active:opacity-90',
        className
      )}
    >
      {children}
    </Component>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn('px-4 py-3 border-b border-soft/50', className)}>
      {children}
    </View>
  )
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn('p-4', className)}>
      {children}
    </View>
  )
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn('px-4 py-3 border-t border-soft/50', className)}>
      {children}
    </View>
  )
}
