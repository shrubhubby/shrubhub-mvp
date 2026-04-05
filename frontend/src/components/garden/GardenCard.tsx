'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Fence, Sprout, MapPin, Trash2, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Garden {
  id: string
  name: string
  description: string | null
  garden_type: string | null
  location_description: string | null
  sun_exposure: string | null
  soil_type: string | null
}

interface GardenCardProps {
  garden: Garden
  plantCount: number
}

export function GardenCard({ garden, plantCount }: GardenCardProps) {
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)
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
      setShowEditModal(false)
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
      <Card elevation={1}>
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
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-lg text-coal/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete empty garden"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 rounded-lg text-coal/30 hover:text-ocean-deep hover:bg-ocean-deep/10 transition-colors"
                title="Edit garden"
              >
                <Pencil size={16} />
              </button>
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

      {/* Delete confirmation dialog (for empty gardens) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-coal">Delete Garden?</h3>
            <p className="text-sm text-coal/60">
              {hasPlants
                ? `This will permanently delete "${garden.name}" and its ${plantCount} plant${plantCount !== 1 ? 's' : ''}. This cannot be undone.`
                : `Delete "${garden.name}"? This cannot be undone.`}
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

      {/* Edit Garden modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-soft/50">
              <h3 className="text-lg font-semibold text-coal">Edit Garden</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg hover:bg-soft transition-colors"
              >
                <X size={20} className="text-coal/50" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-coal mb-1">Name</label>
                <p className="text-coal/80">{garden.name}</p>
              </div>
              {garden.description && (
                <div>
                  <label className="block text-sm font-medium text-coal mb-1">Description</label>
                  <p className="text-sm text-coal/60">{garden.description}</p>
                </div>
              )}
              {garden.garden_type && (
                <div>
                  <label className="block text-sm font-medium text-coal mb-1">Type</label>
                  <p className="text-sm text-coal/60 capitalize">{garden.garden_type.replace('_', ' ')}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-coal mb-1">Plants</label>
                <p className="text-sm text-coal/60">{plantCount} plant{plantCount !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Footer with delete (always visible in modal) */}
            <div className="px-6 py-4 border-t border-soft/50 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setShowDeleteConfirm(true)
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                {hasPlants ? `Delete garden & ${plantCount} plant${plantCount !== 1 ? 's' : ''}` : 'Delete garden'}
              </button>
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
