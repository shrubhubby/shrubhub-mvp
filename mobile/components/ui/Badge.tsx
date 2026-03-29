import React from 'react'
import { View, Text } from 'react-native'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'healthy' | 'attention' | 'urgent' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'neutral', size = 'md', className }: BadgeProps) {
  const variants = {
    healthy: 'bg-healthy/10 border-healthy/20',
    attention: 'bg-attention/10 border-attention/20',
    urgent: 'bg-urgent/10 border-urgent/20',
    neutral: 'bg-soft border-soft'
  }

  const textColors = {
    healthy: 'text-healthy',
    attention: 'text-attention',
    urgent: 'text-urgent',
    neutral: 'text-coal'
  }

  const sizes = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm'
  }

  return (
    <View
      className={cn(
        'flex-row items-center gap-1 rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      <Text className={cn(textColors[variant], textSizes[size], 'font-medium')}>
        {children}
      </Text>
    </View>
  )
}
