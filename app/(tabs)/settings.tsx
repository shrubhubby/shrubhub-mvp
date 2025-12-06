import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

export default function SettingsScreen() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [displayName, setDisplayName] = useState('Gardener')

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email || '')
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    router.replace('/(auth)/login')
  }

  return (
    <View className="flex-1 bg-soft">
      <Header />

      <ScrollView className="flex-1" contentContainerClassName="pb-20">
        <View className="px-4 py-6 gap-6 max-w-4xl">
          <View>
            <Text className="text-3xl font-bold text-coal">Settings</Text>
            <Text className="text-coal/60 mt-1">
              Manage your account and preferences
            </Text>
          </View>

          {/* Profile settings */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">👤</Text>
                <Text className="text-xl font-semibold text-coal">Profile</Text>
              </View>
            </CardHeader>
            <CardContent className="gap-4">
              <Input
                label="Display Name"
                placeholder="Your name"
                value={displayName}
                onChangeText={setDisplayName}
              />
              <Input
                label="Email"
                placeholder="your@email.com"
                value={userEmail}
                editable={false}
              />
              <Button variant="primary">Save Changes</Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">🔔</Text>
                <Text className="text-xl font-semibold text-coal">Notifications</Text>
              </View>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-medium text-coal">Watering Reminders</Text>
                  <Text className="text-sm text-coal/60">
                    Get notified when your plants need water
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card>
            <CardContent>
              <Button
                variant="outline"
                onPress={handleLogout}
                disabled={isLoading}
                className="w-full"
              >
                <Text className="text-coal font-medium">
                  {isLoading ? 'Logging out...' : '🚪 Logout'}
                </Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}
