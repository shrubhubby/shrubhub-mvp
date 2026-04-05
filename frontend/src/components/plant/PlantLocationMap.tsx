'use client'

import React, { useEffect, useRef, useState } from 'react'

interface Coordinate {
  latitude: number
  longitude: number
}

interface PlantLocationMapProps {
  gardenBoundaryWKT: string
  plantLat: number
  plantLng: number
  gardenCenter?: { lat: number; lng: number }
}

function parseBoundary(wkt: string): Coordinate[] {
  const coordString = wkt.match(/\(\((.*?)\)\)/)?.[1]
  if (!coordString) return []
  const coords = coordString.split(',').map(pair => {
    const [lng, lat] = pair.trim().split(' ').map(Number)
    return { latitude: lat, longitude: lng }
  })
  if (
    coords.length > 1 &&
    coords[0].latitude === coords[coords.length - 1].latitude &&
    coords[0].longitude === coords[coords.length - 1].longitude
  ) {
    coords.pop()
  }
  return coords
}

export function PlantLocationMap({
  gardenBoundaryWKT,
  plantLat,
  plantLng,
  gardenCenter,
}: PlantLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const boundary = parseBoundary(gardenBoundaryWKT)

  // Calculate center from boundary if not provided
  const center = gardenCenter || (boundary.length > 0
    ? {
        lat: boundary.reduce((s, c) => s + c.latitude, 0) / boundary.length,
        lng: boundary.reduce((s, c) => s + c.longitude, 0) / boundary.length,
      }
    : { lat: plantLat, lng: plantLng })

  useEffect(() => {
    if (!mapRef.current || !apiKey) return

    const initMap = () => {
      if (!mapRef.current) return

      const googleMap = new google.maps.Map(mapRef.current, {
        center,
        zoom: 19,
        mapTypeId: 'satellite',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: 'none',
        clickableIcons: false,
        disableDefaultUI: true,
      })

      // Draw garden polygon
      if (boundary.length >= 3) {
        new google.maps.Polygon({
          paths: boundary.map(c => ({ lat: c.latitude, lng: c.longitude })),
          strokeColor: '#2563EB',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#2563EB',
          fillOpacity: 0.15,
          map: googleMap,
        })
      }

      // Draw plant marker as a dot
      new google.maps.Marker({
        position: { lat: plantLat, lng: plantLng },
        map: googleMap,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#228B1B',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
          scale: 10,
        },
        title: 'Plant location',
      })

      // Fit bounds to show entire garden + plant
      if (boundary.length >= 3) {
        const bounds = new google.maps.LatLngBounds()
        boundary.forEach(c => bounds.extend({ lat: c.latitude, lng: c.longitude }))
        bounds.extend({ lat: plantLat, lng: plantLng })
        googleMap.fitBounds(bounds, 30)
      }

      setMap(googleMap)
    }

    if (!document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
      script.async = true
      script.defer = true
      script.onload = initMap
      document.head.appendChild(script)
    } else if (typeof google !== 'undefined' && google.maps) {
      initMap()
    } else {
      const interval = setInterval(() => {
        if (typeof google !== 'undefined' && google.maps) {
          clearInterval(interval)
          initMap()
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [apiKey])

  if (!apiKey) {
    return (
      <div className="h-48 flex items-center justify-center bg-soft rounded-xl border border-soft/50">
        <p className="text-coal/40 text-sm">Map not available</p>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className="rounded-xl overflow-hidden border border-soft/50"
      style={{ height: '200px', width: '100%' }}
    />
  )
}
