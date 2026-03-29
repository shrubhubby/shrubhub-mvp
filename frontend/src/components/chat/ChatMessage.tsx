import React from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { Bot } from 'lucide-react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  userAvatar?: string | null
}

export function ChatMessage({ role, content, timestamp, userAvatar }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <Avatar src={userAvatar} size="sm" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'px-4 py-2 rounded-2xl',
            isUser
              ? 'bg-forest text-white rounded-tr-sm'
              : 'bg-soft text-coal rounded-tl-sm'
          )}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
        </div>
        {timestamp && (
          <span className="text-xs text-coal/50 px-2">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  )
}
