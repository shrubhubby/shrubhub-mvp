'use client'

import React, { useState } from 'react'
import { GoogleMapWeb } from './GoogleMapWeb'
import { Button } from '@/components/ui/Button'
import { MapPin, Pencil, Check, Trash2 } from 'lucide-react'

interface Coordinate {
  latitude: number
  longitude: number
}

interface GardenBoundaryEditorProps {
  initialBoundary?: Coordinate[]
  initialCenter?: { lat: number; lng: number }
  onBoundaryChange: (boundary: Coordinate[]) => void
  onCenterChange?: (lat: number, lng: number) => void
}

export function GardenBoundaryEditor({
  initialBoundary = [],
  initialCenter,
  onBoundaryChange,
  onCenterChange,
}: GardenBoundaryEditorProps) {
  const [boundary, setBoundary] = useState<Coordinate[]>(initialBoundary)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    initialCenter || { lat: 39.8283, lng: -98.5795 }
  )
  const [mapZoom, setMapZoom] = useState(initialCenter ? 18 : 4)

  const handleMapClick = (lat: number, lng: number) => {
    if (!isDrawing) return
    const newBoundary = [...boundary, { latitude: lat, longitude: lng }]
    setBoundary(newBoundary)
    onBoundaryChange(newBoundary)
  }

  const handleMarkerDrag = (index: number, lat: number, lng: number) => {
    const newBoundary = [...boundary]
    newBoundary[index] = { latitude: lat, longitude: lng }
    setBoundary(newBoundary)
    onBoundaryChange(newBoundary)
  }

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing)
  }

  const clearBoundary = () => {
    setBoundary([])
    setIsDrawing(false)
    onBoundaryChange([])
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setMapCenter({ lat, lng })
        setMapZoom(18)
        onCenterChange?.(lat, lng)
        setIsLocating(false)
      },
      () => {
        alert('Failed to get your location.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-coal">Garden Boundary</h3>
          <p className="text-xs text-coal/50 mt-0.5">
            {isDrawing
              ? 'Click on the map to place boundary points. Drag points to adjust.'
              : 'Define your garden area on the satellite map.'}
          </p>
        </div>
        {boundary.length > 0 && !isDrawing && (
          <span className="text-xs text-coal/40">
            {boundary.length} point{boundary.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={useMyLocation}
          disabled={isLocating}
        >
          <MapPin size={14} />
          {isLocating ? 'Locating...' : 'My Location'}
        </Button>

        <Button
          variant={isDrawing ? 'primary' : 'outline'}
          size="sm"
          onClick={toggleDrawing}
        >
          {isDrawing ? <Check size={14} /> : <Pencil size={14} />}
          {isDrawing ? 'Done Drawing' : 'Draw Boundary'}
        </Button>

        {boundary.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearBoundary}>
            <Trash2 size={14} />
            Clear
          </Button>
        )}
      </div>

      {/* Drawing hint */}
      {isDrawing && (
        <div className="bg-forest/5 border border-forest/20 rounded-lg px-3 py-2">
          <p className="text-xs text-forest">
            Click on the map to add boundary points. Need at least 3 points to form a polygon.
          </p>
        </div>
      )}

      {/* Map */}
      <GoogleMapWeb
        center={mapCenter}
        zoom={mapZoom}
        isDrawing={isDrawing}
        boundary={boundary}
        onMapClick={handleMapClick}
        onMarkerDrag={handleMarkerDrag}
      />
    </div>
  )
}

// WKT conversion utilities
export function parseBoundaryFromWKT(wkt: string): Coordinate[] {
  const coordString = wkt.match(/\(\((.*?)\)\)/)?.[1]
  if (!coordString) return []

  const coords = coordString.split(',').map((pair: string) => {
    const [lng, lat] = pair.trim().split(' ').map(Number)
    return { latitude: lat, longitude: lng }
  })

  // Remove closing duplicate point
  if (
    coords.length > 1 &&
    coords[0].latitude === coords[coords.length - 1].latitude &&
    coords[0].longitude === coords[coords.length - 1].longitude
  ) {
    coords.pop()
  }

  return coords
}

export function convertBoundaryToWKT(coords: Coordinate[]): string | null {
  if (coords.length < 3) return null
  const coordStrings = coords.map(c => `${c.longitude} ${c.latitude}`)
  coordStrings.push(coordStrings[0]) // Close the polygon
  return `POLYGON((${coordStrings.join(', ')}))`
}
