'use client'

import React, { useEffect, useRef, useState } from 'react'

interface Coordinate {
  latitude: number
  longitude: number
}

interface GoogleMapWebProps {
  center: { lat: number; lng: number }
  zoom: number
  isDrawing: boolean
  boundary: Coordinate[]
  onMapClick?: (lat: number, lng: number) => void
  onMarkerDrag?: (index: number, lat: number, lng: number) => void
}

export function GoogleMapWeb({
  center,
  zoom,
  isDrawing,
  boundary,
  onMapClick,
  onMarkerDrag,
}: GoogleMapWebProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !apiKey) return

    const initMap = () => {
      if (!mapRef.current) return
      const googleMap = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeId: 'satellite',
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'greedy',
        clickableIcons: false,
      })
      setMap(googleMap)
    }

    if (!document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
      script.async = true
      script.defer = true
      script.onload = initMap
      document.head.appendChild(script)
    } else if (typeof google !== 'undefined' && google.maps) {
      initMap()
    } else {
      // Script tag exists but not loaded yet — wait for it
      const interval = setInterval(() => {
        if (typeof google !== 'undefined' && google.maps) {
          clearInterval(interval)
          initMap()
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [apiKey])

  // Click listener
  useEffect(() => {
    if (!map) return
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current)
    }
    clickListenerRef.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (isDrawing && e.latLng && onMapClick) {
        onMapClick(e.latLng.lat(), e.latLng.lng())
      }
    })
    // Update cursor
    map.setOptions({ draggableCursor: isDrawing ? 'crosshair' : undefined })
    return () => {
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current)
      }
    }
  }, [map, isDrawing, onMapClick])

  // Update center on initial load
  useEffect(() => {
    if (map && !polygon && markers.length === 0) {
      map.setCenter(center)
      map.setZoom(zoom)
    }
  }, [map, center.lat, center.lng])

  // Update polygon and markers
  useEffect(() => {
    if (!map) return

    if (polygon) polygon.setMap(null)
    markers.forEach(m => m.setMap(null))

    if (boundary.length > 0) {
      const path = boundary.map(c => ({ lat: c.latitude, lng: c.longitude }))

      if (boundary.length >= 3) {
        const newPolygon = new google.maps.Polygon({
          paths: path,
          strokeColor: '#2563EB',
          strokeOpacity: 1.0,
          strokeWeight: 3,
          fillColor: '#2563EB',
          fillOpacity: 0.25,
          editable: false,
          draggable: false,
        })
        newPolygon.setMap(map)
        setPolygon(newPolygon)
      } else {
        setPolygon(null)
      }

      const newMarkers = boundary.map((coord, index) => {
        const marker = new google.maps.Marker({
          position: { lat: coord.latitude, lng: coord.longitude },
          map,
          draggable: true,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#2563EB',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 8,
          },
        })
        marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
          if (e.latLng && onMarkerDrag) {
            onMarkerDrag(index, e.latLng.lat(), e.latLng.lng())
          }
        })
        return marker
      })
      setMarkers(newMarkers)
    } else {
      setPolygon(null)
      setMarkers([])
    }

    return () => {
      if (polygon) polygon.setMap(null)
      markers.forEach(m => m.setMap(null))
    }
  }, [map, boundary, isDrawing])

  if (!apiKey) {
    return (
      <div className="h-96 flex items-center justify-center bg-soft rounded-xl border border-soft/50">
        <p className="text-coal/40 text-sm">
          Google Maps API key not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local
        </p>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className="rounded-xl overflow-hidden border border-soft/50"
      style={{ height: '384px', width: '100%' }}
    />
  )
}
