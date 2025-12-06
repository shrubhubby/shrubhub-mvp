import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { cn } from '@/lib/utils'

interface ButtonProps {
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function Button({
  onPress,
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  className,
}: ButtonProps) {
  const baseStyles = 'rounded-md flex-row items-center justify-center gap-2'

  const variants = {
    primary: 'bg-forest active:opacity-80',
    secondary: 'bg-ocean-deep active:opacity-80',
    outline: 'border-2 border-forest active:bg-forest/5',
    ghost: 'active:bg-soft',
    icon: 'rounded-full bg-soft active:bg-ocean-light'
  }

  const sizes = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-3'
  }

  const textColors = {
    primary: 'text-white font-medium',
    secondary: 'text-white font-medium',
    outline: 'text-forest font-medium',
    ghost: 'text-coal font-medium',
    icon: 'text-coal font-medium'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && 'opacity-50',
        className
      )}
    >
      {typeof children === 'string' ? (
        <Text className={cn(textColors[variant], textSizes[size])}>
          {children}
        </Text>
      ) : React.isValidElement(children) ? (
        children
      ) : (
        <Text className={cn(textColors[variant], textSizes[size])}>
          {String(children)}
        </Text>
      )}
    </Pressable>
  )
}
