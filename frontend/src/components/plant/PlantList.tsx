'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Sprout, Droplet, MapPin, Trash2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Plant {
  id: string
  common_name: string
  custom_name: string | null
  health_status: string
  status: string
  acquired_date: string | null
  garden_id: string
  plants_master: {
    common_names: string[] | null
    scientific_name: string | null
  } | null
}

interface PlantListProps {
  plants: Plant[]
  gardenNameMap: Record<string, string>
}

export function PlantList({ plants: initialPlants, gardenNameMap }: PlantListProps) {
  const router = useRouter()
  const [plants, setPlants] = useState(initialPlants)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<{ id: string; name: string } | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/plants?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setPlants(prev => prev.filter(p => p.id !== id))
      setShowConfirm(null)
    } catch (error) {
      console.error('Error deleting plant:', error)
      alert('Failed to delete plant.')
    } finally {
      setDeletingId(null)
    }
  }

  const healthColor = (h: string) =>
    h === 'healthy' ? 'healthy'
    : h === 'needs_attention' ? 'attention'
    : h === 'sick' || h === 'pest_issue' ? 'urgent'
    : 'neutral'

  return (
    <>
      <div className="space-y-2">
        {plants.map((plant) => {
          const name = plant.custom_name || plant.plants_master?.common_names?.[0] || plant.common_name || 'Unknown'
          const scientific = plant.plants_master?.scientific_name
          const gardenName = gardenNameMap[plant.garden_id]

          return (
            <Card
              key={plant.id}
              className="group hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/plants/${plant.id}`)}
            >
              <CardContent className="flex items-center gap-4 py-3">
                <div className="w-12 h-12 rounded-lg bg-soft flex items-center justify-center flex-shrink-0">
                  <Sprout size={22} className="text-forest/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-coal truncate">{name}</p>
                    <Badge variant={healthColor(plant.health_status)} className="text-xs flex-shrink-0">
                      {plant.health_status?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-coal/50 mt-0.5">
                    {scientific && <span className="italic truncate">{scientific}</span>}
                    {gardenName && (
                      <span className="flex items-center gap-0.5 flex-shrink-0">
                        <MapPin size={10} /> {gardenName}
                      </span>
                    )}
                    {plant.acquired_date && (
                      <span className="flex items-center gap-0.5 flex-shrink-0">
                        <Droplet size={10} /> {formatRelativeTime(plant.acquired_date)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-coal/40 capitalize">
                    {plant.status?.replace('_', ' ')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowConfirm({ id: plant.id, name })
                    }}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 text-coal/30 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Delete plant"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Delete confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-coal">Delete Plant?</h3>
            <p className="text-sm text-coal/60">
              Permanently delete &quot;{showConfirm.name}&quot;? All activities, photos, and observations for this plant will also be deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(null)}
                className="flex-1"
                disabled={!!deletingId}
              >
                Cancel
              </Button>
              <button
                onClick={() => handleDelete(showConfirm.id)}
                disabled={!!deletingId}
                className="flex-1 px-4 py-2 rounded-md font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deletingId === showConfirm.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
