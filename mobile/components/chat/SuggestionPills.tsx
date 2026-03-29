import React from 'react'
import { View, ScrollView } from 'react-native'
import { Button } from '@/components/ui/Button'

interface SuggestionPill {
  text: string
  action: string
}

interface SuggestionPillsProps {
  suggestions: SuggestionPill[]
  onSelect: (action: string) => void
}

export function SuggestionPills({ suggestions, onSelect }: SuggestionPillsProps) {
  if (suggestions.length === 0) return null

  return (
    <View className="p-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onPress={() => onSelect(suggestion.action)}
              className="rounded-full"
            >
              {suggestion.text}
            </Button>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
