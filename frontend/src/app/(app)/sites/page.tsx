import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MapPin, Plus, Fence } from 'lucide-react'

export default async function SitesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gardener } = await supabase
    .from('gardeners')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('gardener_id', gardener?.id)
    .order('created_at', { ascending: false })

  // Get garden counts per site
  const { data: gardens } = await supabase
    .from('gardens')
    .select('id, site_id')
    .eq('gardener_id', gardener?.id)

  const gardenCountBySite = (gardens || []).reduce((acc: Record<string, number>, g: any) => {
    if (g.site_id) acc[g.site_id] = (acc[g.site_id] || 0) + 1
    return acc
  }, {})

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-coal">Locations</h1>
          <p className="text-coal/60 mt-1">Your gardening sites and properties</p>
        </div>
        <Link href="/sites/add">
          <Button variant="primary">
            <Plus size={20} /> New Location
          </Button>
        </Link>
      </div>

      {!sites || sites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin size={48} className="mx-auto text-forest/30 mb-4" />
            <h3 className="text-lg font-semibold text-coal mb-2">No locations yet</h3>
            <p className="text-coal/60 mb-4">Add a location like your home or a community garden plot.</p>
            <Link href="/sites/add">
              <Button variant="primary">
                <Plus size={20} /> Add Location
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site: any) => {
            const gardenCount = gardenCountBySite[site.id] || 0
            return (
              <Card key={site.id} elevation={1}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-coal">{site.name}</h3>
                      {site.address && (
                        <p className="text-xs text-coal/50 truncate max-w-[200px]">{site.address}</p>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-forest/10 flex items-center justify-center">
                      <MapPin size={20} className="text-forest" />
                    </div>
                  </div>
                  {site.description && (
                    <p className="text-sm text-coal/60 line-clamp-2">{site.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-coal/50">
                    <span className="flex items-center gap-1">
                      <Fence size={14} /> {gardenCount} garden{gardenCount !== 1 ? 's' : ''}
                    </span>
                    {site.location_lat && site.location_lng && (
                      <span className="text-xs">
                        {Number(site.location_lat).toFixed(4)}, {Number(site.location_lng).toFixed(4)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
