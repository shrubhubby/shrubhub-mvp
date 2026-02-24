import React, { useState } from 'react'
import { View, Text, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function EnterInviteCodeScreen() {
  const router = useRouter()
  const [code, setCode] = useState('')

  const handleSubmit = () => {
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) {
      Alert.alert('Code Required', 'Please enter an invite code.')
      return
    }

    router.push(`/invite/${cleanCode}`)
  }

  return (
    <View className="flex-1 bg-soft">
      <Header title="Join Garden" showBack />

      <View className="flex-1 p-4">
        <Card>
          <CardContent className="gap-4">
            <View className="items-center gap-2">
              <Text className="text-4xl">🌱</Text>
              <Text className="text-lg font-semibold text-coal">Join a Garden</Text>
              <Text className="text-sm text-coal/60 text-center">
                Enter the invite code you received to join a garden
              </Text>
            </View>

            <Input
              label="Invite Code"
              value={code}
              onChangeText={setCode}
              placeholder="Enter 8-character code"
              autoCapitalize="characters"
              maxLength={8}
            />

            <Button
              variant="primary"
              onPress={handleSubmit}
              disabled={!code.trim()}
            >
              <Text className="text-white font-medium">Join Garden</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
