import React, { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SignupScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async () => {
    setError('')
    setIsLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          },
        },
      })

      if (authError) throw authError

      // Redirect to conversational UI (main page at /)
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
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
        contentContainerClassName="flex-1 items-center justify-center p-4 bg-ocean-mist"
        className="bg-ocean-mist"
      >
        <View className="w-full max-w-md">
          <View className="bg-white rounded-2xl p-8 gap-6 shadow-lg">
            {/* Logo */}
            <View className="items-center gap-2">
              <View className="w-16 h-16 bg-forest rounded-xl items-center justify-center">
                <Text className="text-white font-bold text-3xl">🌱</Text>
              </View>
              <Text className="text-2xl font-bold text-coal">Join ShrubHub</Text>
              <Text className="text-coal/60">Start your gardening journey today</Text>
            </View>

            {/* Form */}
            <View className="gap-4">
              <Input
                label="Name"
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                editable={!isLoading}
              />

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
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />

              {error && (
                <View className="bg-urgent/10 rounded-lg px-4 py-3">
                  <Text className="text-sm text-urgent">{error}</Text>
                </View>
              )}

              <Button
                onPress={handleSignup}
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </View>

            {/* Footer */}
            <View className="items-center flex-row gap-1">
              <Text className="text-sm text-coal/60">
                Already have an account?
              </Text>
              <Link href="/(auth)/login" asChild>
                <Text className="text-sm text-forest font-medium">Sign in</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
