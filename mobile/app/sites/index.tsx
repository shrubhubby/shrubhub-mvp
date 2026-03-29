import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Link, useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

export default function SitesScreen() {
  const router = useRouter()
  const [sites, setSites] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tableExists, setTableExists] = useState(false)
  const [gardenCounts, setGardenCounts] = useState<Record<string, number>>({})

  useFocusEffect(
    useCallback(() => {
      loadSites()
    }, [])
  )

  const loadSites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/(auth)/login')
        return
      }

      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!gardener) return

      // Try to load sites
      try {
        const { data: sitesData, error } = await supabase
          .from('sites')
          .select('*')
          .eq('gardener_id', gardener.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setSites(sitesData || [])
        setTableExists(true)

        // Load garden counts
        if (sitesData && sitesData.length > 0) {
          const counts: Record<string, number> = {}
          for (const site of sitesData) {
            const { count } = await supabase
              .from('gardens')
              .select('*', { count: 'exact', head: true })
              .eq('site_id', site.id)
              .is('archived_at', null)

            counts[site.id] = count || 0
          }
          setGardenCounts(counts)
        }
      } catch (error: any) {
        // Sites table doesn't exist yet
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setTableExists(false)
        } else {
          throw error
        }
      }
    } catch (error) {
      console.error('Error loading sites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-soft">
        <Header showBack title="Sites" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-coal/60">Loading...</Text>
        </View>
      </View>
    )
  }

  if (!tableExists) {
    return (
      <View className="flex-1 bg-soft">
        <Header showBack title="Sites" />

        <ScrollView className="flex-1" contentContainerClassName="pb-20">
          <View className="px-4 py-6 gap-6">
            <Card>
              <CardContent className="items-center py-12 gap-4">
                <Text className="text-6xl mb-4">🚧</Text>
                <Text className="text-xl font-semibold text-coal mb-2">
                  Sites Feature Coming Soon
                </Text>
                <Text className="text-coal/60 text-center px-4 mb-4">
                  The Sites feature requires a database update. Sites will let you group gardens by physical location (e.g., "My House", "Community Garden") and share weather and environmental data.
                </Text>
                <Button variant="outline" onPress={() => router.back()}>
                  <Text className="text-coal font-medium">Go Back</Text>
                </Button>
              </CardContent>
            </Card>

            {/* SQL Migration Info */}
            <Card>
              <CardHeader>
                <Text className="text-lg font-semibold text-coal">📋 Database Migration Needed</Text>
              </CardHeader>
              <CardContent className="gap-3">
                <Text className="text-sm text-coal/80">
                  To enable Sites, run this SQL migration in your Supabase dashboard:
                </Text>
                <View className="bg-coal/5 p-3 rounded-lg">
                  <Text className="text-xs font-mono text-coal/80">
                    {`CREATE TABLE sites (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  gardener_id UUID REFERENCES gardeners(id),\n  name TEXT NOT NULL,\n  location_description TEXT,\n  location_lat DECIMAL(10, 8),\n  location_lng DECIMAL(11, 8),\n  hardiness_zone TEXT,\n  timezone TEXT DEFAULT 'UTC',\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nALTER TABLE gardens\nADD COLUMN site_id UUID REFERENCES sites(id);`}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-soft">
      <Header showBack title="Sites" />

      <ScrollView className="flex-1" contentContainerClassName="pb-20">
        <View className="px-4 py-6 gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-coal">Sites</Text>
              <Text className="text-coal/60 mt-1">
                Physical locations for your gardens
              </Text>
            </View>
            <Link href="/sites/add" asChild>
              <Button variant="primary" size="sm">
                <Text className="text-white font-medium">+ Add Site</Text>
              </Button>
            </Link>
          </View>

          {/* Sites List */}
          {sites.length === 0 ? (
            <Card>
              <CardContent className="items-center py-12">
                <Text className="text-6xl mb-4">🏡</Text>
                <Text className="text-xl font-semibold text-coal mb-2">
                  No sites yet
                </Text>
                <Text className="text-coal/60 text-center mb-4">
                  Create a site to group gardens by location
                </Text>
                <Link href="/sites/add" asChild>
                  <Button variant="primary">
                    <Text className="text-white font-medium">Create Site</Text>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <View className="gap-4">
              {sites.map((site) => (
                <Card key={site.id}>
                  <CardHeader>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-xl font-semibold text-coal">
                          🏡 {site.name}
                        </Text>
                        {site.location_description && (
                          <Text className="text-sm text-coal/60 mt-1">
                            📍 {site.location_description}
                          </Text>
                        )}
                      </View>
                    </View>
                  </CardHeader>
                  <CardContent className="gap-3">
                    {/* Stats */}
                    <View className="flex-row gap-4">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">🏡</Text>
                        <View>
                          <Text className="text-lg font-semibold text-coal">
                            {gardenCounts[site.id] || 0}
                          </Text>
                          <Text className="text-xs text-coal/60">Gardens</Text>
                        </View>
                      </View>
                      {site.hardiness_zone && (
                        <View className="flex-row items-center gap-2">
                          <Text className="text-2xl">🌡️</Text>
                          <View>
                            <Text className="text-sm font-medium text-coal">
                              Zone {site.hardiness_zone}
                            </Text>
                            <Text className="text-xs text-coal/60">Hardiness</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Actions */}
                    <Link href={`/sites/${site.id}`} asChild>
                      <Button variant="primary" size="sm">
                        <Text className="text-white font-medium text-sm">View Details</Text>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}

          {/* Info */}
          <Card>
            <CardContent>
              <Text className="text-sm text-coal/60">
                💡 Sites represent physical locations (like "My House" or "Community Garden") where you have multiple gardens. Each site can track weather, hardiness zone, and environmental data that applies to all gardens at that location.
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  )
}
