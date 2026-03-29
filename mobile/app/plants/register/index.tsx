import React, { useState, useEffect } from 'react'
import { View, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { AcquisitionMethodPicker, AcquisitionMethod } from '@/components/plant/AcquisitionMethodPicker'
import { supabase } from '@/lib/supabase/client'

export default function RegisterPlantIndex() {
  const router = useRouter()
  const [gardenerId, setGardenerId] = useState<string | undefined>()

  useEffect(() => {
    loadGardenerId()
  }, [])

  const loadGardenerId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: gardener } = await supabase
      .from('gardeners')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (gardener) {
      setGardenerId(gardener.id)
    }
  }

  const handleMethodSelect = (
    method: AcquisitionMethod,
    route: string,
    userSourceId?: string
  ) => {
    // Navigate to the specific registration flow
    // Pass the method and optional userSourceId as query params
    const params: Record<string, string> = { method }
    if (userSourceId) {
      params.userSourceId = userSourceId
    }

    router.push({
      pathname: route as any,
      params,
    })
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-soft">
        <Header title="Register Plant" showBack />
        <AcquisitionMethodPicker
          onSelect={handleMethodSelect}
          gardenerId={gardenerId}
        />
        <BottomNav />
      </View>
    </KeyboardAvoidingView>
  )
}
