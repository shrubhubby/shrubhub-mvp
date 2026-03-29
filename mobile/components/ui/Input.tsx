import React from 'react'
import { View, Text, TextInput, TextInputProps } from 'react-native'
import { cn } from '@/lib/utils'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  icon?: React.ReactNode
  className?: string
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <View className="w-full">
        {label && (
          <Text className="text-sm font-medium text-coal mb-1">
            {label}
          </Text>
        )}
        <View className="relative">
          {icon && (
            <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              {icon}
            </View>
          )}
          <TextInput
            ref={ref}
            className={cn(
              'w-full px-4 py-2 rounded-lg border border-soft bg-white text-coal',
              'placeholder:text-coal/40',
              icon && 'pl-10',
              error && 'border-urgent',
              className
            )}
            placeholderTextColor="#33333366"
            editable={!props.disabled}
            {...props}
          />
        </View>
        {error && (
          <Text className="text-sm text-urgent mt-1">{error}</Text>
        )}
      </View>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextInputProps {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<TextInput, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <View className="w-full">
        {label && (
          <Text className="text-sm font-medium text-coal mb-1">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          multiline
          numberOfLines={4}
          className={cn(
            'w-full px-4 py-2 rounded-lg border border-soft bg-white text-coal',
            'placeholder:text-coal/40',
            error && 'border-urgent',
            className
          )}
          placeholderTextColor="#33333366"
          textAlignVertical="top"
          {...props}
        />
        {error && (
          <Text className="text-sm text-urgent mt-1">{error}</Text>
        )}
      </View>
    )
  }
)

Textarea.displayName = 'Textarea'
