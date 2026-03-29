import React from 'react'
import { PlantCard } from './PlantCard'
import type { Database } from '@/types/database.types'

type Plant = Database['public']['Tables']['plants']['Row'] & {
  plants_master?: Database['public']['Tables']['plants_master']['Row'] | null
}

interface PlantGridProps {
  plants: Plant[]
  emptyMessage?: string
}

export function PlantGrid({ plants, emptyMessage = 'No plants yet' }: PlantGridProps) {
  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">🌱</div>
        <h3 className="text-xl font-semibold text-coal mb-2">
          {emptyMessage}
        </h3>
        <p className="text-coal/60">
          Start your garden journey by adding your first plant!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {plants.map((plant) => (
        <PlantCard key={plant.id} plant={plant} />
      ))}
    </div>
  )
}
