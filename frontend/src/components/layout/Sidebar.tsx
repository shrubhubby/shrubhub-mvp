'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sprout, MessageCircle, Calendar, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/plants', label: 'My Plants', icon: Sprout },
  { href: '/chat', label: 'AI Assistant', icon: MessageCircle },
  { href: '/activities', label: 'Activities', icon: Calendar }
]

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/logout', label: 'Logout', icon: LogOut }
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-coal/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-white border-r border-soft/50 transition-transform duration-300',
          'w-64 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:sticky'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-4 border-b border-soft/50">
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
        <div className="border-t border-soft/50 p-3 space-y-1">
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
      </aside>
    </>
  )
}
