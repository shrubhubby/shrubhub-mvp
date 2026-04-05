'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft, Droplet, Sun, Thermometer, Scissors, Leaf,
  Calendar, MapPin, TreeDeciduous, ChevronDown, ChevronUp,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { PlantLocationMap } from './PlantLocationMap'

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
  boundary: string | null
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

// --- Activity type helpers ---

const ACTIVITY_TYPES = [
  'watering', 'fertilizing', 'pruning', 'repotting', 'transplanting',
  'harvesting', 'treating_pests', 'treating_disease', 'staking',
  'mulching', 'soil_amendment', 'deadheading', 'thinning', 'germination', 'other',
]

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

// --- Component ---

type Tab = 'activities' | 'lineage'

export function PlantDetail({ plant, photos, activities, lineage, children }: PlantDetailProps) {
  const [tab, setTab] = useState<Tab>('activities')
  const [activityFilter, setActivityFilter] = useState<string>('all')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const master = plant.plants_master
  const care = plant.care_override || master?.care_guide || null
  const garden = plant.gardens
  const displayName = plant.custom_name || plant.common_name
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const photoUrl = (path: string) =>
    `${supabaseUrl}/storage/v1/object/public/plant-photos/${path}`

  const healthVariant = (h: string) =>
    h === 'healthy' ? 'healthy'
    : h === 'needs_attention' ? 'attention'
    : h === 'sick' || h === 'pest_issue' ? 'urgent'
    : 'neutral'

  const filteredActivities = activityFilter === 'all'
    ? activities
    : activities.filter(a => a.activity_type === activityFilter)

  // Determine active activity types for filter buttons
  const activeTypes = [...new Set(activities.map(a => a.activity_type))]

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
      </div>

      {/* Location map — plant dot inside garden polygon */}
      {garden?.boundary && plant.location_lat && plant.location_lng && (
        <PlantLocationMap
          gardenBoundaryWKT={garden.boundary}
          plantLat={plant.location_lat}
          plantLng={plant.location_lng}
          gardenCenter={
            garden.location_lat && garden.location_lng
              ? { lat: garden.location_lat, lng: garden.location_lng }
              : undefined
          }
        />
      )}

      {/* Photo gallery */}
      {photos.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-medium text-coal mb-3">
              Photos ({photos.length})
            </h3>
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
          </CardContent>
        </Card>
      )}

      {/* Plant identification & taxonomy */}
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
          </div>
        </CardContent>
      </Card>

      {/* Default Care Instructions */}
      {care && (
        <Card>
          <CardContent className="space-y-3">
            <h3 className="text-sm font-medium text-coal">Care Instructions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {care.sunlight && (
                <div className="flex items-start gap-2 p-3 bg-soft rounded-lg">
                  <Sun size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-coal/50">Sunlight</p>
                    <p className="text-sm font-medium text-coal">
                      {sunlightLabel(care.sunlight)}
                    </p>
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
                      <p className="text-xs text-coal/40 mt-0.5">
                        pH {care.soil.ph_min} – {care.soil.ph_max}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {care.pruning && (
                <div className="flex items-start gap-2 p-3 bg-soft rounded-lg">
                  <Scissors size={18} className="text-coal/50 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-coal/50">Pruning</p>
                    <p className="text-sm font-medium text-coal capitalize">
                      {care.pruning.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Activities | Lineage */}
      <div className="flex gap-1 bg-soft rounded-lg p-1">
        <button
          onClick={() => setTab('activities')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tab === 'activities'
              ? 'bg-white text-coal shadow-sm'
              : 'text-coal/50 hover:text-coal'
          }`}
        >
          Activities ({activities.length})
        </button>
        <button
          onClick={() => setTab('lineage')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tab === 'lineage'
              ? 'bg-white text-coal shadow-sm'
              : 'text-coal/50 hover:text-coal'
          }`}
        >
          Lineage
        </button>
      </div>

      {/* Tab Content: Activities */}
      {tab === 'activities' && (
        <div className="space-y-3">
          {/* Activity type filters */}
          {activeTypes.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setActivityFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activityFilter === 'all'
                    ? 'bg-forest text-white'
                    : 'bg-soft text-coal/60 hover:bg-soft/80'
                }`}
              >
                All
              </button>
              {activeTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setActivityFilter(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                    activityFilter === type
                      ? 'bg-forest text-white'
                      : 'bg-soft text-coal/60 hover:bg-soft/80'
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
                    <span className="text-xl mt-0.5">
                      {activityIcon(activity.activity_type)}
                    </span>
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
                      {activity.notes && (
                        <p className="text-xs text-coal/60 mt-0.5">{activity.notes}</p>
                      )}
                      {activity.product_used && (
                        <p className="text-xs text-coal/40 mt-0.5">
                          Product: {activity.product_used}
                        </p>
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

      {/* Tab Content: Lineage */}
      {tab === 'lineage' && (
        <div className="space-y-4">
          {/* Parent chain */}
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
                    <Link
                      href={`/plants/${ancestor.id}`}
                      className="text-sm text-forest hover:underline"
                    >
                      {ancestor.custom_name || ancestor.common_name}
                    </Link>
                    {ancestor.acquisition_source && (
                      <span className="text-xs text-coal/40 capitalize">
                        ({ancestor.acquisition_source.replace('_', ' ')})
                      </span>
                    )}
                  </div>
                ))}
                {/* Current plant */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center" style={{ width: 24 }}>
                    <div className="w-0.5 h-3 bg-coal/15" />
                    <div className="w-4 h-4 rounded-full bg-forest border-2 border-forest" />
                  </div>
                  <span className="text-sm font-semibold text-coal">
                    {displayName}
                  </span>
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
                {!plant.parent_plant_id && (
                  <p className="text-xs text-coal/30 mt-1">
                    This plant has no recorded parent or offspring.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Children / offspring */}
          {children.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-coal mb-2">
                Offspring ({children.length})
              </h3>
              <div className="space-y-2">
                {children.map(child => (
                  <Link key={child.id} href={`/plants/${child.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                        <span className="text-xs text-coal/40 capitalize">
                          {child.status.replace('_', ' ')}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
