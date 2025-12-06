import React from 'react'
import { View, Text, Pressable, FlatList } from 'react-native'
import { Link, useRouter, usePathname } from 'expo-router'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuPress?: () => void
  showBack?: boolean
  title?: string
  user?: {
    display_name?: string
    avatar_url?: string | null
  } | null
}

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/plants', label: 'Plants', icon: '🌱' },
  { href: '/gardens', label: 'Gardens', icon: '🏡' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/activities', label: 'Activities', icon: '📅' },
  { href: '/sites', label: 'Sites', icon: '🌍' },
]

export function Header({ onMenuPress, showBack, title, user }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <View className="bg-white border-b border-soft/50">
      {/* Top Row: Logo and User */}
      <View className="px-4 h-14 flex-row items-center justify-between">
        {/* Left: Back button or Logo */}
        {showBack ? (
          <Pressable onPress={() => router.back()} className="p-2 active:bg-soft rounded-lg">
            <Text className="text-2xl">←</Text>
          </Pressable>
        ) : (
          <Link href="/" asChild>
            <Pressable className="flex-row items-center gap-2">
              <View className="w-8 h-8 bg-forest rounded-lg items-center justify-center">
                <Text className="text-white font-bold text-lg">🌱</Text>
              </View>
              <Text className="text-lg font-bold text-coal">ShrubHub</Text>
            </Pressable>
          </Link>
        )}

        {/* Center: Title (if provided) */}
        {title && (
          <Text className="text-lg font-semibold text-coal">{title}</Text>
        )}

        {/* Right: User actions */}
        <View className="flex-row items-center gap-2">
          <Link href="/settings" asChild>
            <Pressable className="p-2 active:bg-soft rounded-lg">
              <Text className="text-lg">⚙️</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* Bottom Row: Navigation */}
      {!showBack && (
        <View className="border-t border-soft/50">
          <FlatList
            horizontal
            data={navItems}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8, gap: 4 }}
            keyExtractor={(item) => item.href}
            renderItem={({ item }) => {
              const isActive = pathname === item.href ||
                               (item.href !== '/' && pathname?.startsWith(item.href))

              return (
                <Link href={item.href} asChild>
                  <Pressable
                    className={cn(
                      'px-4 py-2 rounded-lg flex-row items-center gap-2',
                      isActive ? 'bg-forest/10' : 'active:bg-soft'
                    )}
                  >
                    <Text className="text-base">{item.icon}</Text>
                    <Text
                      className={cn(
                        'text-sm font-medium',
                        isActive ? 'text-forest' : 'text-coal/70'
                      )}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                </Link>
              )
            }}
          />
        </View>
      )}
    </View>
  )
}
