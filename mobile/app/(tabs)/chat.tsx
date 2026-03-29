import React, { useState, useRef, useEffect } from 'react'
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { SuggestionPills } from '@/components/chat/SuggestionPills'
import { Header } from '@/components/layout/Header'

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

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI gardening assistant. How can I help you with your plants today?",
      timestamp: new Date()
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Mock response - replace with actual API call
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm here to help with your plants! This is a demo response. The actual AI integration will be connected soon.",
          timestamp: new Date()
        }
        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Chat error:', error)
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header />

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerClassName="p-4"
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
          />
        ))}
        {isLoading && (
          <View className="flex-row gap-3 mb-4">
            <View className="w-8 h-8 rounded-full bg-forest items-center justify-center">
              <Text>🤖</Text>
            </View>
            <View className="bg-soft px-4 py-2 rounded-2xl rounded-tl-sm">
              <Text className="text-coal/60">Typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {messages.length === 1 && (
        <View className="border-t border-soft/50 bg-soft/30">
          <SuggestionPills
            suggestions={initialSuggestions}
            onSelect={handleSuggestion}
          />
        </View>
      )}

      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </KeyboardAvoidingView>
  )
}
