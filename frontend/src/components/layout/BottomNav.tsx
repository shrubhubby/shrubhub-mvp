'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sprout, Fence, MapPin, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/plants', label: 'Plants', icon: Sprout },
  { href: '/gardens', label: 'Gardens', icon: Fence },
  { href: '/sites', label: 'Locations', icon: MapPin },
  { href: '/chat', label: 'Chat', icon: MessageCircle }
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur border-t border-soft/50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'text-forest bg-forest/10'
                  : 'text-coal/60 hover:text-coal hover:bg-soft/50'
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
