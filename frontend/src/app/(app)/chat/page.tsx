'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { SuggestionPills } from '@/components/chat/SuggestionPills'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const initialSuggestions = [
  { text: 'Show my plants', action: 'list_plants' },
  { text: 'Water schedule', action: 'water_schedule' },
  { text: 'Add a plant', action: 'add_plant' },
  { text: 'Garden tips', action: 'garden_tips' }
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI gardening assistant. How can I help you with your plants today?",
      timestamp: new Date()
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Call AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'Sorry, I encountered an error.',
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestion = (action: string) => {
    const suggestionMap: Record<string, string> = {
      list_plants: 'Show me all my plants',
      water_schedule: 'What plants need watering?',
      add_plant: 'I want to add a new plant',
      garden_tips: 'Give me some gardening tips'
    }
    handleSend(suggestionMap[action] || action)
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-6 space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="flex gap-1 items-center bg-soft px-4 py-2 rounded-2xl rounded-tl-sm">
                <div className="w-2 h-2 bg-coal/40 rounded-full animate-pulse-dot" />
                <div className="w-2 h-2 bg-coal/40 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-coal/40 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="border-t border-soft/50 bg-soft/30">
          <div className="container mx-auto max-w-4xl">
            <SuggestionPills
              suggestions={initialSuggestions}
              onSelect={handleSuggestion}
            />
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  )
}
