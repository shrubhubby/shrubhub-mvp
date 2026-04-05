'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft, Pencil, Trash2, Sprout, Droplet, MapPin, X, Check,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import {
  GardenBoundaryEditor,
  parseBoundaryFromWKT,
  convertBoundaryToWKT,
} from '@/components/map/GardenBoundaryEditor'

const GARDEN_TYPES = [
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'container', label: 'Container' },
  { value: 'raised_bed', label: 'Raised Bed' },
  { value: 'in_ground', label: 'In Ground' },
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'community_plot', label: 'Community Plot' },
  { value: 'mixed', label: 'Mixed' },
]

const SUN_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'full_sun', label: 'Full Sun' },
  { value: 'partial_shade', label: 'Partial Shade' },
  { value: 'full_shade', label: 'Full Shade' },
  { value: 'varies', label: 'Varies' },
]

interface Garden {
  id: string
  name: string
  description: string | null
  garden_type: string | null
  location_description: string | null
  location_lat: number | null
  location_lng: number | null
  boundary: string | null
  sun_exposure: string | null
  soil_type: string | null
  is_primary: boolean
  created_at: string
}

interface Plant {
  id: string
  common_name: string
  custom_name: string | null
  health_status: string
  status: string
  acquired_date: string | null
  location_in_garden: string | null
  plants_master: {
    common_names: string[] | null
    scientific_name: string | null
  } | null
}

interface Coordinate {
  latitude: number
  longitude: number
}

interface GardenDetailProps {
  garden: Garden
  plants: Plant[]
}

export function GardenDetail({ garden: initialGarden, plants }: GardenDetailProps) {
  const router = useRouter()
  const [garden, setGarden] = useState(initialGarden)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState(garden.name)
  const [editDescription, setEditDescription] = useState(garden.description || '')
  const [editType, setEditType] = useState(garden.garden_type || 'outdoor')
  const [editLocation, setEditLocation] = useState(garden.location_description || '')
  const [editSun, setEditSun] = useState(garden.sun_exposure || '')
  const [editSoil, setEditSoil] = useState(garden.soil_type || '')
  const [editBoundary, setEditBoundary] = useState<Coordinate[]>(
    garden.boundary ? parseBoundaryFromWKT(garden.boundary) : []
  )
  const [editLat, setEditLat] = useState(garden.location_lat)
  const [editLng, setEditLng] = useState(garden.location_lng)

  const initialCenter = garden.location_lat && garden.location_lng
    ? { lat: garden.location_lat, lng: garden.location_lng }
    : undefined

  const startEditing = () => {
    setEditName(garden.name)
    setEditDescription(garden.description || '')
    setEditType(garden.garden_type || 'outdoor')
    setEditLocation(garden.location_description || '')
    setEditSun(garden.sun_exposure || '')
    setEditSoil(garden.soil_type || '')
    setEditBoundary(garden.boundary ? parseBoundaryFromWKT(garden.boundary) : [])
    setEditLat(garden.location_lat)
    setEditLng(garden.location_lng)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!editName.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/gardens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: garden.id,
          name: editName.trim(),
          description: editDescription.trim(),
          garden_type: editType,
          location_description: editLocation.trim(),
          sun_exposure: editSun || null,
          soil_type: editSoil.trim() || null,
          boundary: convertBoundaryToWKT(editBoundary),
          location_lat: editLat,
          location_lng: editLng,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      setGarden(data.garden)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving garden:', error)
      alert('Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/gardens?id=${garden.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/gardens')
    } catch (error) {
      console.error('Error deleting garden:', error)
      alert('Failed to delete garden.')
    } finally {
      setIsDeleting(false)
    }
  }

  const healthColor = (h: string) =>
    h === 'healthy' ? 'healthy'
    : h === 'needs_attention' ? 'attention'
    : h === 'sick' || h === 'pest_issue' ? 'urgent'
    : 'neutral'

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/gardens">
          <button className="p-2 rounded-lg hover:bg-soft transition-colors">
            <ArrowLeft size={20} className="text-coal/60" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-coal truncate">
            {garden.name}
          </h1>
          {garden.garden_type && (
            <p className="text-sm text-coal/50 capitalize">
              {garden.garden_type.replace('_', ' ')}
            </p>
          )}
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil size={16} /> Edit
          </Button>
        )}
      </div>

      {/* Garden Info / Edit Form */}
      {isEditing ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              <Input
                label="Name *"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Garden name"
              />
              <Textarea
                label="Description"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Describe this garden..."
                rows={3}
              />
              <div>
                <label className="block text-sm font-medium text-coal mb-1">Type</label>
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-soft bg-white text-coal focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest transition-all duration-200"
                >
                  {GARDEN_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Location"
                value={editLocation}
                onChange={e => setEditLocation(e.target.value)}
                placeholder="e.g., Backyard south side"
              />
              <div>
                <label className="block text-sm font-medium text-coal mb-1">Sun Exposure</label>
                <select
                  value={editSun}
                  onChange={e => setEditSun(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-soft bg-white text-coal focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest transition-all duration-200"
                >
                  {SUN_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Soil Type"
                value={editSoil}
                onChange={e => setEditSoil(e.target.value)}
                placeholder="e.g., Sandy loam, clay"
              />
            </CardContent>
          </Card>

          {/* Boundary Editor */}
          <Card>
            <CardContent>
              <GardenBoundaryEditor
                initialBoundary={editBoundary}
                initialCenter={initialCenter}
                onBoundaryChange={setEditBoundary}
                onCenterChange={(lat, lng) => {
                  setEditLat(lat)
                  setEditLng(lng)
                }}
              />
            </CardContent>
          </Card>

          {/* Save / Delete actions */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setIsEditing(false); setShowDeleteConfirm(true) }}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                  {plants.length > 0
                    ? `Delete garden & ${plants.length} plant${plants.length !== 1 ? 's' : ''}`
                    : 'Delete garden'}
                </button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving || !editName.trim()}>
                    <Check size={16} /> {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              {garden.description && (
                <p className="text-coal/70">{garden.description}</p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-coal/50">
                {garden.location_description && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {garden.location_description}
                  </span>
                )}
                {garden.sun_exposure && (
                  <span className="capitalize">{garden.sun_exposure.replace('_', ' ')}</span>
                )}
                {garden.soil_type && (
                  <span>{garden.soil_type}</span>
                )}
                <span>{plants.length} plant{plants.length !== 1 ? 's' : ''}</span>
              </div>
            </CardContent>
          </Card>

          {/* Read-only boundary map */}
          {garden.boundary && (
            <Card>
              <CardContent>
                <GardenBoundaryEditor
                  initialBoundary={parseBoundaryFromWKT(garden.boundary)}
                  initialCenter={initialCenter}
                  onBoundaryChange={() => {}}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Plants List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-coal">
            Plants ({plants.length})
          </h2>
          <Link href="/plants/add">
            <Button variant="primary" size="sm">
              <Sprout size={16} /> Add Plant
            </Button>
          </Link>
        </div>

        {plants.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Sprout size={36} className="mx-auto text-forest/20 mb-3" />
              <p className="text-coal/50">No plants in this garden yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {plants.map((plant) => {
              const name = plant.custom_name || plant.plants_master?.common_names?.[0] || plant.common_name || 'Unknown'
              const scientific = plant.plants_master?.scientific_name

              return (
                <Link key={plant.id} href={`/plants/${plant.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-soft flex items-center justify-center flex-shrink-0">
                        <Sprout size={18} className="text-forest/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-coal truncate">{name}</p>
                          <Badge variant={healthColor(plant.health_status)} size="sm" className="flex-shrink-0">
                            {plant.health_status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-coal/50 mt-0.5">
                          {scientific && <span className="italic truncate">{scientific}</span>}
                          {plant.location_in_garden && (
                            <span className="flex items-center gap-0.5 flex-shrink-0">
                              <MapPin size={10} /> {plant.location_in_garden}
                            </span>
                          )}
                          {plant.acquired_date && (
                            <span className="flex items-center gap-0.5 flex-shrink-0">
                              <Droplet size={10} /> {formatRelativeTime(plant.acquired_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-coal/40 capitalize flex-shrink-0">
                        {plant.status?.replace('_', ' ')}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-coal">Delete Garden?</h3>
            <p className="text-sm text-coal/60">
              {plants.length > 0
                ? `This will permanently delete "${garden.name}" and its ${plants.length} plant${plants.length !== 1 ? 's' : ''}. This cannot be undone.`
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
    </div>
  )
}
