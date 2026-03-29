'use client'

import React from 'react'
import Link from 'next/link'
import { Menu, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

interface HeaderProps {
  onMenuClick?: () => void
  user?: {
    name?: string
    avatar_url?: string | null
  } | null
}

export function Header({ onMenuClick, user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-soft/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Menu button (mobile) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu size={24} />
        </Button>

        {/* Center: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-forest rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">🌱</span>
          </div>
          <span className="text-xl font-semibold text-coal hidden sm:inline">
            ShrubHub
          </span>
        </Link>

        {/* Right: User actions */}
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <Settings size={20} />
            </Button>
          </Link>
          <Link href="/profile">
            <Avatar
              src={user?.avatar_url}
              alt={user?.name}
              size="sm"
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
