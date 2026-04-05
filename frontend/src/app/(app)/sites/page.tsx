import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { MapPin } from 'lucide-react'

export default async function SitesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-coal">Locations</h1>
        <p className="text-coal/60 mt-1">Your gardening sites and properties</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <MapPin size={48} className="mx-auto text-forest/30 mb-4" />
          <h3 className="text-lg font-semibold text-coal mb-2">Coming Soon</h3>
          <p className="text-coal/60">
            Sites will let you group gardens by physical location with shared weather data and boundary maps.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
