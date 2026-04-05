'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea } from '@/components/ui/Input'
import {
  ArrowLeft, Droplet, Sun, Thermometer, Scissors, Leaf,
  Calendar, MapPin, TreeDeciduous, Pencil, Check, X, Plus,
  Camera, Upload,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { PlantLocationMap } from './PlantLocationMap'
import { createClient } from '@/lib/supabase/client'

// --- Types ---

interface CareGuide {
  watering?: { frequency?: string; amount?: string; notes?: string }
  sunlight?: string
  temperature?: { min_f?: number; max_f?: number }
  soil?: { ph_min?: number; ph_max?: number; type?: string }
  fertilizing?: { frequency?: string; type?: string }
  pruning?: string
  toxicity?: { pets?: boolean; humans?: boolean }
}

interface PlantMaster {
  id: string
  scientific_name: string
  common_names: string[]
  family: string | null
  plant_type: string | null
  care_guide: CareGuide | null
  hardiness_zones: string[] | null
  growth_rate: string | null
  mature_height_inches: number | null
  mature_width_inches: number | null
  default_image_url: string | null
}

interface Garden {
  id: string
  name: string
  gardener_id: string
  location_lat: number | null
  location_lng: number | null
}

interface Plant {
  id: string
  garden_id: string
  plant_master_id: string | null
  parent_plant_id: string | null
  common_name: string
  custom_name: string | null
  location_in_garden: string | null
  location_lat: number | null
  location_lng: number | null
  acquired_date: string
  acquisition_source: string | null
  acquisition_notes: string | null
  status: string
  health_status: string
  planted_date: string | null
  care_override: CareGuide | null
  plants_master: PlantMaster | null
  gardens: Garden | null
}

interface Photo {
  id: string
  storage_path: string
  thumbnail_path: string | null
  taken_at: string
  photo_type: string
  caption: string | null
  is_primary: boolean
}

interface Activity {
  id: string
  activity_type: string
  notes: string | null
  quantity: number | null
  quantity_unit: string | null
  product_used: string | null
  performed_at: string
  duration_minutes: number | null
}

interface LineagePlant {
  id: string
  common_name: string
  custom_name: string | null
  parent_plant_id: string | null
  acquisition_source: string | null
  acquired_date: string | null
}

interface ChildPlant {
  id: string
  common_name: string
  custom_name: string | null
  acquisition_source: string | null
  acquired_date: string | null
  status: string
}

interface PlantDetailProps {
  plant: Plant
  photos: Photo[]
  activities: Activity[]
  lineage: LineagePlant[]
  children: ChildPlant[]
}

// --- Helpers ---

const ACTIVITY_TYPES = [
  'watering', 'fertilizing', 'pruning', 'repotting', 'transplanting',
  'harvesting', 'treating_pests', 'treating_disease', 'staking',
  'mulching', 'soil_amendment', 'deadheading', 'thinning', 'germination', 'other',
]

const STATUS_OPTIONS = [
  'seed', 'germinating', 'seedling', 'vegetative', 'flowering',
  'fruiting', 'dormant', 'alive', 'struggling', 'dead', 'harvested', 'adopted_out',
]

const HEALTH_OPTIONS = ['healthy', 'needs_attention', 'sick', 'pest_issue', 'dead']

const activityIcon = (type: string) => {
  const icons: Record<string, string> = {
    watering: '💧', fertilizing: '🧪', pruning: '✂️', repotting: '🪴',
    transplanting: '🚚', harvesting: '🧺', treating_pests: '🐛',
    treating_disease: '💊', staking: '🏗️', mulching: '🍂',
    soil_amendment: '🧱', deadheading: '✂️', thinning: '🌿',
    germination: '🌱', other: '📝',
  }
  return icons[type] || '📝'
}

const sunlightLabel = (s: string | undefined) => {
  if (!s) return null
  const map: Record<string, string> = {
    full_sun: 'Full Sun', partial_sun: 'Partial Sun',
    partial_shade: 'Partial Shade', full_shade: 'Full Shade',
  }
  return map[s] || s.replace('_', ' ')
}

const healthVariant = (h: string) =>
  h === 'healthy' ? 'healthy'
  : h === 'needs_attention' ? 'attention'
  : h === 'sick' || h === 'pest_issue' ? 'urgent'
  : 'neutral'

type Tab = 'activities' | 'lineage'

// --- Component ---

export function PlantDetail({ plant: initialPlant, photos: initialPhotos, activities, lineage, children }: PlantDetailProps) {
  const router = useRouter()
  const [plant, setPlant] = useState(initialPlant)
  const [photos, setPhotos] = useState(initialPhotos)
  const [tab, setTab] = useState<Tab>('activities')
  const [activityFilter, setActivityFilter] = useState<string>('all')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editName, setEditName] = useState(plant.common_name)
  const [editCustomName, setEditCustomName] = useState(plant.custom_name || '')
  const [editStatus, setEditStatus] = useState(plant.status)
  const [editHealth, setEditHealth] = useState(plant.health_status)
  const [editLocation, setEditLocation] = useState(plant.location_in_garden || '')
  const [editNotes, setEditNotes] = useState(plant.acquisition_notes || '')

  // Photo upload state
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const master = plant.plants_master
  const care = plant.care_override || master?.care_guide || null
  const garden = plant.gardens
  const displayName = plant.custom_name || plant.common_name
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const photoUrl = (path: string) =>
    `${supabaseUrl}/storage/v1/object/public/plant-photos/${path}`

  // --- Edit handlers ---

  const startEditing = () => {
    setEditName(plant.common_name)
    setEditCustomName(plant.custom_name || '')
    setEditStatus(plant.status)
    setEditHealth(plant.health_status)
    setEditLocation(plant.location_in_garden || '')
    setEditNotes(plant.acquisition_notes || '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editName.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/plants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: plant.id,
          common_name: editName.trim(),
          custom_name: editCustomName.trim() || null,
          status: editStatus,
          health_status: editHealth,
          location_in_garden: editLocation.trim() || null,
          acquisition_notes: editNotes.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      setPlant(data.plant)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving plant:', error)
      alert('Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  // --- Photo upload ---

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const supabase = createClient()
      const now = new Date().toISOString()

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop() || 'jpg'
        const storagePath = `plants/${plant.id}/general_${Date.now()}_${i}.${ext}`

        // Extract date from file if possible, otherwise use now
        const takenAt = file.lastModified
          ? new Date(file.lastModified).toISOString()
          : now

        const { error: uploadError } = await supabase.storage
          .from('plant-photos')
          .upload(storagePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        // Create plant_photos record
        const { data: photoRecord, error: insertError } = await supabase
          .from('plant_photos')
          .insert({
            plant_id: plant.id,
            storage_bucket: 'plant-photos',
            storage_path: storagePath,
            taken_at: takenAt,
            uploaded_at: now,
            mime_type: file.type,
            file_size_bytes: file.size,
            photo_type: 'general',
            is_primary: photos.length === 0 && i === 0,
            display_order: photos.length + i,
          })
          .select()
          .single()

        if (!insertError && photoRecord) {
          setPhotos(prev => [photoRecord, ...prev])
        }
      }
    } catch (error) {
      console.error('Error uploading photos:', error)
      alert('Failed to upload photos.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // --- Derived data ---

  const filteredActivities = activityFilter === 'all'
    ? activities
    : activities.filter(a => a.activity_type === activityFilter)

  const activeTypes = [...new Set(activities.map(a => a.activity_type))]

  // --- Render ---

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={garden ? `/gardens/${garden.id}` : '/plants'}>
          <button className="p-2 rounded-lg hover:bg-soft transition-colors">
            <ArrowLeft size={20} className="text-coal/60" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-coal truncate">
            {displayName}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={healthVariant(plant.health_status)} size="sm">
              {plant.health_status.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-coal/40 capitalize">
              {plant.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil size={16} /> Edit
          </Button>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <Card>
          <CardContent className="space-y-4">
            <Input
              label="Common Name *"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="e.g., Tomato"
            />
            <Input
              label="Nickname"
              value={editCustomName}
              onChange={e => setEditCustomName(e.target.value)}
              placeholder="e.g., Big Red"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coal mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-soft bg-white text-coal focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest transition-all duration-200"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-coal mb-1">Health</label>
                <select
                  value={editHealth}
                  onChange={e => setEditHealth(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-soft bg-white text-coal focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest transition-all duration-200"
                >
                  {HEALTH_OPTIONS.map(h => (
                    <option key={h} value={h}>{h.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              label="Location in Garden"
              value={editLocation}
              onChange={e => setEditLocation(e.target.value)}
              placeholder="e.g., South raised bed, left side"
            />
            <Textarea
              label="Notes"
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Any notes about this plant..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving || !editName.trim()}>
                <Check size={16} /> {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location map */}
      {garden && plant.location_lat && plant.location_lng && (
        <PlantLocationMap
          gardenBoundaryWKT=""
          plantLat={plant.location_lat}
          plantLng={plant.location_lng}
          gardenCenter={
            garden.location_lat && garden.location_lng
              ? { lat: garden.location_lat, lng: garden.location_lng }
              : undefined
          }
        />
      )}

      {/* Photo gallery + upload */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-coal">
              Photos ({photos.length})
            </h3>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>Uploading...</>
                ) : (
                  <><Plus size={14} /> Add Photos</>
                )}
              </Button>
            </div>
          </div>

          {photos.length > 0 ? (
            <>
              <div className="flex gap-2 flex-wrap">
                {photos.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhoto(
                      selectedPhoto === photo.id ? null : photo.id
                    )}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPhoto === photo.id ? 'border-forest scale-105' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={photoUrl(photo.thumbnail_path || photo.storage_path)}
                      alt={photo.caption || 'Plant photo'}
                      className="w-full h-full object-cover"
                    />
                    {photo.is_primary && (
                      <div className="absolute top-0.5 right-0.5 bg-forest text-white text-[8px] px-1 rounded">
                        Primary
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {/* Expanded photo */}
              {selectedPhoto && (() => {
                const photo = photos.find(p => p.id === selectedPhoto)
                if (!photo) return null
                return (
                  <div className="mt-3">
                    <img
                      src={photoUrl(photo.storage_path)}
                      alt={photo.caption || 'Plant photo'}
                      className="w-full max-h-96 object-contain rounded-lg bg-soft"
                    />
                    <div className="flex items-center gap-3 mt-2 text-xs text-coal/50">
                      <span>{new Date(photo.taken_at).toLocaleDateString()}</span>
                      <span className="capitalize">{photo.photo_type.replace('_', ' ')}</span>
                      {photo.caption && <span>{photo.caption}</span>}
                    </div>
                  </div>
                )
              })()}
            </>
          ) : (
            <div className="py-6 text-center">
              <Camera size={32} className="mx-auto text-coal/20 mb-2" />
              <p className="text-sm text-coal/50">No photos yet</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-forest hover:underline mt-1"
              >
                Upload the first photo
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plant info (read-only) */}
      {!isEditing && (
        <Card>
          <CardContent className="space-y-3">
            <h3 className="text-sm font-medium text-coal">Plant Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-coal/50">Common Name</span>
                <p className="font-medium text-coal">{plant.common_name}</p>
              </div>
              {master?.scientific_name && (
                <div>
                  <span className="text-coal/50">Species</span>
                  <p className="font-medium text-coal italic">{master.scientific_name}</p>
                </div>
              )}
              {master?.family && (
                <div>
                  <span className="text-coal/50">Family</span>
                  <p className="font-medium text-coal">{master.family}</p>
                </div>
              )}
              {master?.plant_type && (
                <div>
                  <span className="text-coal/50">Type</span>
                  <p className="font-medium text-coal capitalize">{master.plant_type}</p>
                </div>
              )}
              {plant.custom_name && plant.custom_name !== plant.common_name && (
                <div>
                  <span className="text-coal/50">Nickname</span>
                  <p className="font-medium text-coal">{plant.custom_name}</p>
                </div>
              )}
              {plant.acquired_date && (
                <div>
                  <span className="text-coal/50">Acquired</span>
                  <p className="font-medium text-coal">{formatRelativeTime(plant.acquired_date)}</p>
                </div>
              )}
              {plant.location_in_garden && (
                <div>
                  <span className="text-coal/50">Location</span>
                  <p className="font-medium text-coal">{plant.location_in_garden}</p>
                </div>
              )}
              {plant.acquisition_source && (
                <div>
                  <span className="text-coal/50">Source</span>
                  <p className="font-medium text-coal capitalize">{plant.acquisition_source.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Care Instructions */}
      {care && !isEditing && (
        <Card>
          <CardContent className="space-y-3">
            <h3 className="text-sm font-medium text-coal">Care Instructions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {care.sunlight && (
                <div className="flex items-start gap-2 p-3 bg-soft rounded-lg">
                  <Sun size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-coal/50">Sunlight</p>
                    <p className="text-sm font-medium text-coal">{sunlightLabel(care.sunlight)}</p>
                  </div>
                </div>
              )}
              {care.watering && (
                <div className="flex items-start gap-2 p-3 bg-soft rounded-lg">
                  <Droplet size={18} className="text-ocean-mid mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-coal/50">Watering</p>
                    <p className="text-sm font-medium text-coal capitalize">
                      {care.watering.frequency?.replace('_', ' ') || care.watering.amount || 'See notes'}
                    </p>
                    {care.watering.notes && (
                      <p className="text-xs text-coal/40 mt-0.5">{care.watering.notes}</p>
                    )}
                  </div>
                </div>
              )}
              {care.fertilizing && (
                <div className="flex items-start gap-2 p-3 bg-soft rounded-lg">
                  <Leaf size={18} className="text-forest mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-coal/50">Fertilizer</p>
                    <p className="text-sm font-medium text-coal capitalize">
                      {care.fertilizing.type?.replace('_', ' ') || 'General'}
                    </p>
                    {care.fertilizing.frequency && (
                      <p className="text-xs text-coal/40 mt-0.5 capitalize">
                        {care.fertilizing.frequency.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {care.temperature && (care.temperature.min_f || care.temperature.max_f) && (
                <div className="flex items-start gap-2 p-3 bg-soft rounded-lg">
                  <Thermometer size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-coal/50">Temperature</p>
                    <p className="text-sm font-medium text-coal">
                      {care.temperature.min_f && care.temperature.max_f
                        ? `${care.temperature.min_f}°F – ${care.temperature.max_f}°F`
                        : care.temperature.min_f
                        ? `Min ${care.temperature.min_f}°F`
                        : `Max ${care.temperature.max_f}°F`}
                    </p>
                  </div>
                </div>
              )}
              {care.soil && (
                <div className="flex items-start gap-2 p-3 bg-soft rounded-lg">
                  <TreeDeciduous size={18} className="text-amber-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-coal/50">Soil</p>
                    <p className="text-sm font-medium text-coal capitalize">
                      {care.soil.type?.replace('_', ' ') || 'General'}
                    </p>
                    {care.soil.ph_min && care.soil.ph_max && (
                      <p className="text-xs text-coal/40 mt-0.5">pH {care.soil.ph_min} – {care.soil.ph_max}</p>
                    )}
                  </div>
                </div>
              )}
              {care.pruning && (
                <div className="flex items-start gap-2 p-3 bg-soft rounded-lg">
                  <Scissors size={18} className="text-coal/50 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-coal/50">Pruning</p>
                    <p className="text-sm font-medium text-coal capitalize">{care.pruning.replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-soft rounded-lg p-1">
        <button
          onClick={() => setTab('activities')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tab === 'activities' ? 'bg-white text-coal shadow-sm' : 'text-coal/50 hover:text-coal'
          }`}
        >
          Activities ({activities.length})
        </button>
        <button
          onClick={() => setTab('lineage')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tab === 'lineage' ? 'bg-white text-coal shadow-sm' : 'text-coal/50 hover:text-coal'
          }`}
        >
          Lineage
        </button>
      </div>

      {/* Activities tab */}
      {tab === 'activities' && (
        <div className="space-y-3">
          {activeTypes.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setActivityFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activityFilter === 'all' ? 'bg-forest text-white' : 'bg-soft text-coal/60 hover:bg-soft/80'
                }`}
              >
                All
              </button>
              {activeTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setActivityFilter(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                    activityFilter === type ? 'bg-forest text-white' : 'bg-soft text-coal/60 hover:bg-soft/80'
                  }`}
                >
                  {activityIcon(type)} {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}

          {filteredActivities.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar size={32} className="mx-auto text-coal/20 mb-2" />
                <p className="text-coal/50 text-sm">No activities recorded yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredActivities.map(activity => (
                <Card key={activity.id}>
                  <CardContent className="flex items-start gap-3 py-3">
                    <span className="text-xl mt-0.5">{activityIcon(activity.activity_type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-coal text-sm capitalize">
                          {activity.activity_type.replace('_', ' ')}
                        </p>
                        {activity.quantity && (
                          <span className="text-xs text-coal/40">
                            {activity.quantity} {activity.quantity_unit || ''}
                          </span>
                        )}
                      </div>
                      {activity.notes && <p className="text-xs text-coal/60 mt-0.5">{activity.notes}</p>}
                      {activity.product_used && (
                        <p className="text-xs text-coal/40 mt-0.5">Product: {activity.product_used}</p>
                      )}
                    </div>
                    <span className="text-xs text-coal/40 flex-shrink-0">
                      {formatRelativeTime(activity.performed_at)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lineage tab */}
      {tab === 'lineage' && (
        <div className="space-y-4">
          {lineage.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-coal mb-2">Parent Chain</h3>
              <div className="space-y-1">
                {[...lineage].reverse().map((ancestor, i) => (
                  <div key={ancestor.id} className="flex items-center gap-2">
                    <div className="flex flex-col items-center" style={{ width: 24 }}>
                      {i > 0 && <div className="w-0.5 h-3 bg-coal/15" />}
                      <div className="w-3 h-3 rounded-full bg-forest/30 border-2 border-forest/50" />
                    </div>
                    <Link href={`/plants/${ancestor.id}`} className="text-sm text-forest hover:underline">
                      {ancestor.custom_name || ancestor.common_name}
                    </Link>
                    {ancestor.acquisition_source && (
                      <span className="text-xs text-coal/40 capitalize">
                        ({ancestor.acquisition_source.replace('_', ' ')})
                      </span>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center" style={{ width: 24 }}>
                    <div className="w-0.5 h-3 bg-coal/15" />
                    <div className="w-4 h-4 rounded-full bg-forest border-2 border-forest" />
                  </div>
                  <span className="text-sm font-semibold text-coal">{displayName}</span>
                  <span className="text-xs text-coal/40">(this plant)</span>
                </div>
              </div>
            </div>
          )}

          {lineage.length === 0 && children.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <TreeDeciduous size={32} className="mx-auto text-coal/20 mb-2" />
                <p className="text-coal/50 text-sm">No lineage information available.</p>
              </CardContent>
            </Card>
          )}

          {children.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-coal mb-2">Offspring ({children.length})</h3>
              <div className="space-y-2">
                {children.map(child => (
                  <Card
                    key={child.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/plants/${child.id}`)}
                  >
                    <CardContent className="flex items-center gap-3 py-3">
                      <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center">
                        <span className="text-sm">🌱</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-coal truncate">
                          {child.custom_name || child.common_name}
                        </p>
                        <p className="text-xs text-coal/40 capitalize">
                          {child.acquisition_source?.replace('_', ' ')}
                          {child.acquired_date && ` — ${formatRelativeTime(child.acquired_date)}`}
                        </p>
                      </div>
                      <span className="text-xs text-coal/40 capitalize">{child.status.replace('_', ' ')}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
