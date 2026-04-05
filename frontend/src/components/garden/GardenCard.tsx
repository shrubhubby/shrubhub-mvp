'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Fence, Sprout, MapPin, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Garden {
  id: string
  name: string
  description: string | null
  garden_type: string | null
  location_description: string | null
}

interface GardenCardProps {
  garden: Garden
  plantCount: number
}

export function GardenCard({ garden, plantCount }: GardenCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const hasPlants = plantCount > 0

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/gardens?id=${garden.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      setShowDeleteConfirm(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting garden:', error)
      alert('Failed to delete garden. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Link href={`/gardens/${garden.id}`} className="block">
        <Card elevation={1} className="hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer">
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-coal">{garden.name}</h3>
                {garden.garden_type && (
                  <span className="text-xs text-coal/50 capitalize">
                    {garden.garden_type.replace('_', ' ')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                {/* Trash icon directly on card for empty gardens */}
                {!hasPlants && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowDeleteConfirm(true)
                    }}
                    className="p-2 rounded-lg text-coal/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete empty garden"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <div className="w-10 h-10 rounded-lg bg-ocean-deep/10 flex items-center justify-center">
                  <Fence size={20} className="text-ocean-deep" />
                </div>
              </div>
            </div>
            {garden.description && (
              <p className="text-sm text-coal/60 line-clamp-2">{garden.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-coal/50">
              <span className="flex items-center gap-1">
                <Sprout size={14} /> {plantCount} plant{plantCount !== 1 ? 's' : ''}
              </span>
              {garden.location_description && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={14} /> {garden.location_description}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-coal">Delete Garden?</h3>
            <p className="text-sm text-coal/60">
              Delete &quot;{garden.name}&quot;? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-md font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
