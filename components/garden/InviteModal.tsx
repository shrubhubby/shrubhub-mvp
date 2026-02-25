import React, { useState } from 'react'
import { View, Text, Modal, Pressable, Alert, Share } from 'react-native'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase/client'
import * as Clipboard from 'expo-clipboard'

type InviteRole = 'admin' | 'editor' | 'viewer'

interface InviteModalProps {
  visible: boolean
  onClose: () => void
  gardenId: string
  gardenName: string
}

export function InviteModal({ visible, onClose, gardenId, gardenName }: InviteModalProps) {
  const [inviteType, setInviteType] = useState<'email' | 'code'>('code')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('editor')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  // Don't render the modal at all when not visible
  if (!visible) {
    return null
  }

  const roles: { value: InviteRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Admin', description: 'Can manage members and settings' },
    { value: 'editor', label: 'Editor', description: 'Can add and edit plants' },
    { value: 'viewer', label: 'Viewer', description: 'Can view only' },
  ]

  const handleCreateInvite = async () => {
    if (inviteType === 'email' && !email.trim()) {
      Alert.alert('Email Required', 'Please enter an email address.')
      return
    }

    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        Alert.alert('Error', 'Please log in again.')
        return
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/invite-member`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            garden_id: gardenId,
            role,
            ...(inviteType === 'email' ? { email: email.trim() } : {}),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invite')
      }

      if (data.invite.invite_code) {
        setGeneratedCode(data.invite.invite_code)
      } else {
        Alert.alert('Success', `Invitation sent to ${email}`)
        handleClose()
      }
    } catch (error) {
      console.error('Invite error:', error)
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create invite')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyCode = async () => {
    if (generatedCode) {
      await Clipboard.setStringAsync(generatedCode)
      Alert.alert('Copied', 'Invite code copied to clipboard')
    }
  }

  const handleShareCode = async () => {
    if (generatedCode) {
      try {
        await Share.share({
          message: `Join my garden "${gardenName}" on ShrubHub! Use invite code: ${generatedCode}`,
        })
      } catch (error) {
        console.error('Share error:', error)
      }
    }
  }

  const handleClose = () => {
    setEmail('')
    setRole('editor')
    setGeneratedCode(null)
    setInviteType('code')
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-soft">
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-soft">
          <Text className="text-lg font-semibold text-coal">Invite Member</Text>
          <Pressable onPress={handleClose}>
            <Text className="text-forest">Cancel</Text>
          </Pressable>
        </View>

        <View className="p-4 gap-4">
          {generatedCode ? (
            <Card>
              <CardHeader>
                <Text className="text-base font-semibold text-coal">Invite Code Generated</Text>
              </CardHeader>
              <CardContent className="gap-4">
                <View className="bg-soft p-4 rounded-lg items-center">
                  <Text className="text-2xl font-bold text-forest tracking-widest">
                    {generatedCode}
                  </Text>
                </View>

                <Text className="text-sm text-coal/60 text-center">
                  Share this code with the person you want to invite. They can enter it in the app to join your garden as {role === 'admin' ? 'an' : 'a'} {role}.
                </Text>

                <View className="flex-row gap-3">
                  <Button
                    variant="outline"
                    onPress={handleCopyCode}
                    className="flex-1"
                  >
                    <Text className="text-coal">Copy Code</Text>
                  </Button>
                  <Button
                    variant="primary"
                    onPress={handleShareCode}
                    className="flex-1"
                  >
                    <Text className="text-white font-medium">Share</Text>
                  </Button>
                </View>

                <Button
                  variant="outline"
                  onPress={handleClose}
                >
                  <Text className="text-coal">Done</Text>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Invite Type Toggle */}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setInviteType('code')}
                  className={`flex-1 py-3 rounded-lg border ${
                    inviteType === 'code'
                      ? 'bg-forest border-forest'
                      : 'bg-white border-soft'
                  }`}
                >
                  <Text className={`text-center font-medium ${
                    inviteType === 'code' ? 'text-white' : 'text-coal'
                  }`}>
                    Invite Code
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setInviteType('email')}
                  className={`flex-1 py-3 rounded-lg border ${
                    inviteType === 'email'
                      ? 'bg-forest border-forest'
                      : 'bg-white border-soft'
                  }`}
                >
                  <Text className={`text-center font-medium ${
                    inviteType === 'email' ? 'text-white' : 'text-coal'
                  }`}>
                    Email Invite
                  </Text>
                </Pressable>
              </View>

              {inviteType === 'email' && (
                <Card>
                  <CardContent>
                    <Input
                      label="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="friend@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <Text className="text-base font-semibold text-coal">Select Role</Text>
                </CardHeader>
                <CardContent className="gap-2">
                  {roles.map(r => (
                    <Pressable
                      key={r.value}
                      onPress={() => setRole(r.value)}
                      className={`p-3 rounded-lg border ${
                        role === r.value
                          ? 'bg-forest/10 border-forest'
                          : 'bg-white border-soft'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className={`font-medium ${
                            role === r.value ? 'text-forest' : 'text-coal'
                          }`}>
                            {r.label}
                          </Text>
                          <Text className="text-xs text-coal/60">{r.description}</Text>
                        </View>
                        {role === r.value && (
                          <Text className="text-forest">✓</Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </CardContent>
              </Card>

              <Button
                variant="primary"
                onPress={handleCreateInvite}
                disabled={isLoading}
              >
                <Text className="text-white font-medium">
                  {isLoading ? 'Creating...' : inviteType === 'code' ? 'Generate Code' : 'Send Invite'}
                </Text>
              </Button>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}
