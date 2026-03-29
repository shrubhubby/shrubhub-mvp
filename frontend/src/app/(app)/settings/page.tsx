'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, Bell, Lock, Database, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-coal">Settings</h1>
        <p className="text-coal/60 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={20} />
            <h2 className="text-xl font-semibold text-coal">Profile</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Display Name"
            placeholder="Your name"
            defaultValue="Gardener"
          />
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            disabled
          />
          <Button variant="primary">Save Changes</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell size={20} />
            <h2 className="text-xl font-semibold text-coal">Notifications</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-coal">Watering Reminders</p>
              <p className="text-sm text-coal/60">
                Get notified when your plants need water
              </p>
            </div>
            <input type="checkbox" className="w-5 h-5 text-forest" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-coal">Care Tips</p>
              <p className="text-sm text-coal/60">
                Receive weekly gardening tips and advice
              </p>
            </div>
            <input type="checkbox" className="w-5 h-5 text-forest" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-coal">Activity Updates</p>
              <p className="text-sm text-coal/60">
                Get updates about your plant activities
              </p>
            </div>
            <input type="checkbox" className="w-5 h-5 text-forest" />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock size={20} />
            <h2 className="text-xl font-semibold text-coal">Security</h2>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database size={20} />
            <h2 className="text-xl font-semibold text-coal">Data Management</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            Export My Data
          </Button>
          <Button variant="outline" className="w-full justify-start text-urgent hover:bg-urgent/5">
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full"
          >
            <LogOut size={20} />
            {isLoading ? 'Logging out...' : 'Logout'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
