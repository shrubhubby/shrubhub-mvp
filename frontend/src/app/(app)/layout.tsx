'use client'

import React, { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-soft">
      {/* Desktop sidebar (in-flow, takes space) + Mobile sidebar (overlay) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 pb-20 md:pb-4">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  )
}
