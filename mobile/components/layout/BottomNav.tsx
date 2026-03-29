import React from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import { Link, usePathname } from 'expo-router'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/plants', label: 'Plants', icon: '🌱' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/activities', label: 'Activities', icon: '📅' },
  { href: '/gardens', label: 'Gardens', icon: '🏡' }
]

export function BottomNav() {
  const pathname = usePathname()

  if (Platform.OS !== 'web') {
    return null // On mobile, use tab navigator instead
  }

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-soft/50 md:hidden">
      <View className="flex-row items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href} asChild>
              <Pressable
                className={cn(
                  'flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg',
                  isActive
                    ? 'bg-forest/10'
                    : 'active:bg-soft/50'
                )}
              >
                <Text className="text-xl">{item.icon}</Text>
                <Text
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-forest' : 'text-coal/60'
                  )}
                >
                  {item.label}
                </Text>
              </Pressable>
            </Link>
          )
        })}
      </View>
    </View>
  )
}
