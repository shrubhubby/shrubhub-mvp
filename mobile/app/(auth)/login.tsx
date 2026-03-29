import React, { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setError('')
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Redirect to conversational UI (main page at /)
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message || 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName="flex-1 items-center justify-center p-4 bg-gradient-to-br from-ocean-mist"
        className="bg-ocean-mist"
      >
        <View className="w-full max-w-md">
          <View className="bg-white rounded-2xl p-8 gap-6 shadow-lg">
            {/* Logo */}
            <View className="items-center gap-2">
              <View className="w-16 h-16 bg-forest rounded-xl items-center justify-center">
                <Text className="text-white font-bold text-3xl">🌱</Text>
              </View>
              <Text className="text-2xl font-bold text-coal">Welcome back</Text>
              <Text className="text-coal/60">Sign in to your ShrubHub account</Text>
            </View>

            {/* Form */}
            <View className="gap-4">
              <Input
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />

              {error && (
                <View className="bg-urgent/10 rounded-lg px-4 py-3">
                  <Text className="text-sm text-urgent">{error}</Text>
                </View>
              )}

              <Button
                onPress={handleLogin}
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </View>

            {/* Footer */}
            <View className="items-center flex-row gap-1">
              <Text className="text-sm text-coal/60">
                Don't have an account?
              </Text>
              <Link href="/(auth)/signup" asChild>
                <Text className="text-sm text-forest font-medium">Sign up</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
