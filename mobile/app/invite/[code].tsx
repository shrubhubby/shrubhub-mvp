import React, { useState, useEffect } from 'react'
import { View, Text, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RoleBadge } from '@/components/garden'
import { supabase } from '@/lib/supabase/client'

type Role = 'admin' | 'editor' | 'viewer'

interface InviteInfo {
  garden_name: string
  role: Role
  inviter_name: string
}

export default function AcceptInviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const router = useRouter()
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (code) {
      loadInviteInfo()
    }
  }, [code])

  const loadInviteInfo = async () => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Redirect to login with return URL
        router.replace(`/(auth)/login?redirect=/invite/${code}`)
        return
      }

      // Get invite details
      const { data: invite } = await supabase
        .from('garden_invites')
        .select(`
          role,
          status,
          expires_at,
          garden:gardens (
            name
          ),
          inviter:gardeners!invited_by (
            display_name
          )
        `)
        .eq('invite_code', code?.toUpperCase())
        .single()

      if (!invite) {
        setError('Invite not found. The code may be invalid or expired.')
        return
      }

      if (invite.status !== 'pending') {
        setError('This invite has already been used.')
        return
      }

      if (new Date(invite.expires_at) < new Date()) {
        setError('This invite has expired.')
        return
      }

      setInviteInfo({
        garden_name: (invite.garden as any)?.name || 'Unknown Garden',
        role: invite.role as Role,
        inviter_name: (invite.inviter as any)?.display_name || 'Someone',
      })
    } catch (err) {
      console.error('Error loading invite:', err)
      setError('Failed to load invite details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        Alert.alert('Error', 'Please log in to accept this invite.')
        router.replace(`/(auth)/login?redirect=/invite/${code}`)
        return
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/accept-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ invite_code: code }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invite')
      }

      Alert.alert(
        'Welcome!',
        `You've joined ${data.garden.name} as ${data.role === 'admin' ? 'an' : 'a'} ${data.role}.`,
        [
          {
            text: 'View Garden',
            onPress: () => router.replace(`/gardens/${data.garden.id}`),
          },
        ]
      )
    } catch (err) {
      console.error('Error accepting invite:', err)
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to accept invite')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDecline = () => {
    Alert.alert(
      'Decline Invite?',
      'Are you sure you want to decline this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => router.replace('/'),
        },
      ]
    )
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-soft">
        <Header title="Garden Invite" showBack />
        <View className="flex-1 items-center justify-center">
          <Text className="text-coal/60">Loading invite...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 bg-soft">
        <Header title="Garden Invite" showBack />
        <View className="flex-1 items-center justify-center p-4">
          <Card>
            <CardContent className="items-center gap-4">
              <Text className="text-4xl">😕</Text>
              <Text className="text-base text-coal text-center">{error}</Text>
              <Button variant="primary" onPress={() => router.replace('/')}>
                <Text className="text-white font-medium">Go Home</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-soft">
      <Header title="Garden Invite" showBack />

      <View className="flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="items-center gap-4 py-6">
            <Text className="text-4xl">🌱</Text>

            <View className="items-center">
              <Text className="text-sm text-coal/60">You've been invited to join</Text>
              <Text className="text-xl font-bold text-coal mt-1">
                {inviteInfo?.garden_name}
              </Text>
            </View>

            <View className="items-center">
              <Text className="text-sm text-coal/60 mb-1">Your role will be</Text>
              {inviteInfo?.role && <RoleBadge role={inviteInfo.role} size="md" />}
            </View>

            <Text className="text-xs text-coal/40">
              Invited by {inviteInfo?.inviter_name}
            </Text>

            <View className="w-full gap-3 mt-4">
              <Button
                variant="primary"
                onPress={handleAccept}
                disabled={isAccepting}
              >
                <Text className="text-white font-medium">
                  {isAccepting ? 'Joining...' : 'Accept Invitation'}
                </Text>
              </Button>
              <Button
                variant="outline"
                onPress={handleDecline}
              >
                <Text className="text-coal">Decline</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
