'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, User, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Sign up the user (trigger will automatically create gardener profile)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          },
        },
      })

      if (authError) throw authError

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-ocean-mist via-soft to-leaf-light/20">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-forest rounded-xl flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-3xl">🌱</span>
            </div>
            <h1 className="text-2xl font-bold text-coal">Join ShrubHub</h1>
            <p className="text-coal/60">Start your gardening journey today</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              type="text"
              label="Name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User size={18} />}
              required
              disabled={isLoading}
            />

            <Input
              type="email"
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={18} />}
              required
              disabled={isLoading}
            />

            <Input
              type="password"
              label="Password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              required
              minLength={6}
              disabled={isLoading}
            />

            {error && (
              <div className="text-sm text-urgent bg-urgent/10 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-coal/60">
            Already have an account?{' '}
            <Link href="/login" className="text-forest font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
