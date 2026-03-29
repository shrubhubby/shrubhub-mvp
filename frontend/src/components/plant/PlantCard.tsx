import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Droplet, Sun, Calendar } from 'lucide-react'
import { cn, getDaysSince } from '@/lib/utils'
import type { Database } from '@/types/database.types'

type Plant = Database['public']['Tables']['plants']['Row'] & {
  plants_master?: Database['public']['Tables']['plants_master']['Row'] | null
}

interface PlantCardProps {
  plant: Plant
  className?: string
}

export function PlantCard({ plant, className }: PlantCardProps) {
  const daysSinceWatering = plant.last_watered
    ? getDaysSince(plant.last_watered)
    : null

  const getHealthVariant = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'healthy'
      case 'needs_attention':
        return 'attention'
      case 'sick':
        return 'urgent'
      default:
        return 'neutral'
    }
  }

  const getWaterStatus = () => {
    if (!daysSinceWatering) return null
    if (daysSinceWatering >= 7) return 'urgent'
    if (daysSinceWatering >= 5) return 'attention'
    return 'healthy'
  }

  const waterStatus = getWaterStatus()

  return (
    <Link href={`/plants/${plant.id}`}>
      <Card className={cn('overflow-hidden hover:shadow-lg transition-all', className)} elevation={2}>
        {/* Plant image */}
        <div className="relative h-48 bg-soft overflow-hidden">
          {plant.photo_url ? (
            <img
              src={plant.photo_url}
              alt={plant.custom_name || plant.plants_master?.common_name || 'Plant'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🌱
            </div>
          )}
          {/* Health badge */}
          <div className="absolute top-3 right-3">
            <Badge variant={getHealthVariant(plant.health_status)}>
              {plant.health_status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <CardContent className="space-y-3">
          {/* Plant name */}
          <div>
            <h3 className="font-semibold text-lg text-coal">
              {plant.custom_name || plant.plants_master?.common_name || 'Unknown Plant'}
            </h3>
            {plant.plants_master?.scientific_name && (
              <p className="text-sm text-coal/60 italic">
                {plant.plants_master.scientific_name}
              </p>
            )}
          </div>

          {/* Care status indicators */}
          <div className="flex items-center gap-3 text-sm">
            {/* Water status */}
            {daysSinceWatering !== null && (
              <div className="flex items-center gap-1">
                <Droplet
                  size={16}
                  className={cn(
                    waterStatus === 'urgent' && 'text-urgent',
                    waterStatus === 'attention' && 'text-attention',
                    waterStatus === 'healthy' && 'text-ocean-mid'
                  )}
                />
                <span className="text-coal/70">
                  {daysSinceWatering}d ago
                </span>
              </div>
            )}

            {/* Sunlight */}
            {plant.plants_master?.sunlight && (
              <div className="flex items-center gap-1">
                <Sun size={16} className="text-attention" />
                <span className="text-coal/70 capitalize">
                  {plant.plants_master.sunlight}
                </span>
              </div>
            )}

            {/* Age */}
            {plant.planted_date && (
              <div className="flex items-center gap-1">
                <Calendar size={16} className="text-ocean-mid" />
                <span className="text-coal/70">
                  {getDaysSince(plant.planted_date)}d old
                </span>
              </div>
            )}
          </div>

          {/* Notes preview */}
          {plant.notes && (
            <p className="text-sm text-coal/60 line-clamp-2">
              {plant.notes}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
