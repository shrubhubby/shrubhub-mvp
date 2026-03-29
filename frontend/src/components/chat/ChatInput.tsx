'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Send, Loader2 } from 'lucide-react'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSend = () => {
    if (!message.trim() || isLoading) return

    onSend(message.trim())
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="sticky bottom-0 bg-white border-t border-soft/50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
              className={cn(
                'w-full px-4 py-3 pr-12 rounded-2xl border border-soft bg-soft/50',
                'placeholder:text-coal/40 text-coal',
                'focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest focus:bg-white',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200 resize-none',
                'max-h-32 overflow-y-auto'
              )}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            variant="primary"
            size="md"
            className="rounded-full w-12 h-12 p-0"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
