'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sprout, MessageCircle, Calendar, Fence, MapPin, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/plants', label: 'My Plants', icon: Sprout },
  { href: '/gardens', label: 'Gardens', icon: Fence },
  { href: '/sites', label: 'Locations', icon: MapPin },
  { href: '/chat', label: 'AI Assistant', icon: MessageCircle },
  { href: '/activities', label: 'Activities', icon: Calendar }
]

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-4 border-b border-soft/50 flex-shrink-0">
        <div className="w-10 h-10 bg-forest rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">🌱</span>
        </div>
        <span className="text-xl font-semibold text-coal">ShrubHub</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-forest text-white'
                    : 'text-coal hover:bg-soft'
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-soft/50 p-3 space-y-1 flex-shrink-0">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-coal hover:bg-soft rounded-lg transition-all duration-200"
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar — static, in document flow */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:flex-shrink-0 h-screen sticky top-0 bg-white border-r border-soft/50">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — fixed overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-coal/50" onClick={onClose} />
          <aside className="absolute top-0 left-0 w-64 h-full bg-white border-r border-soft/50 flex flex-col z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
