import React from 'react'
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
    <div className="flex flex-wrap gap-2 p-4">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion.action)}
          className="rounded-full"
        >
          {suggestion.text}
        </Button>
      ))}
    </div>
  )
}
