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
  onMarkerDrag
}: GoogleMapWebProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null)

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !apiKey) return

    // Load Google Maps script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
    script.async = true
    script.defer = true

    script.onload = () => {
      if (!mapRef.current) return

      const googleMap = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeId: 'satellite',
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        // Ensure gestures work on mobile
        gestureHandling: 'greedy',
        clickableIcons: false,
      })

      setMap(googleMap)
    }

    // Only append if not already loaded
    if (!document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      document.head.appendChild(script)
    } else {
      // Script already loaded, initialize map
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
  }, [apiKey])

  // Add/update click listener when isDrawing or onMapClick changes
  useEffect(() => {
    if (!map) return

    // Remove old listener if it exists
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current)
    }

    // Add new listener with current isDrawing and onMapClick
    clickListenerRef.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      console.log('Map clicked', { isDrawing, hasLatLng: !!e.latLng })
      if (isDrawing && e.latLng && onMapClick) {
        onMapClick(e.latLng.lat(), e.latLng.lng())
      }
    })

    return () => {
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current)
      }
    }
  }, [map, isDrawing, onMapClick])

  // Update map center only on initial load
  useEffect(() => {
    if (map && !polygon && markers.length === 0) {
      // Only update center/zoom if we haven't started drawing yet
      map.setCenter(center)
      map.setZoom(zoom)
    }
  }, [map, center.lat, center.lng])

  // Update polygon and markers
  useEffect(() => {
    if (!map) return

    // Clear existing polygon
    if (polygon) {
      polygon.setMap(null)
    }

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))

    if (boundary.length > 0) {
      const path = boundary.map(coord => ({
        lat: coord.latitude,
        lng: coord.longitude
      }))

      // Draw polygon if we have 3+ points
      if (boundary.length >= 3) {
        const newPolygon = new google.maps.Polygon({
          paths: path,
          strokeColor: '#228B1B',
          strokeOpacity: 1.0,
          strokeWeight: 3,
          fillColor: '#228B1B',
          fillOpacity: 0.3,
          editable: false,
          draggable: false
        })
        newPolygon.setMap(map)
        setPolygon(newPolygon)
      }

      // Draw markers for all points
      const newMarkers = boundary.map((coord, index) => {
        const marker = new google.maps.Marker({
          position: { lat: coord.latitude, lng: coord.longitude },
          map,
          draggable: true,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#228B1B',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 8
          }
        })

        marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
          if (e.latLng && onMarkerDrag) {
            onMarkerDrag(index, e.latLng.lat(), e.latLng.lng())
          }
        })

        return marker
      })

      setMarkers(newMarkers)
    }

    return () => {
      if (polygon) polygon.setMap(null)
      markers.forEach(marker => marker.setMap(null))
    }
  }, [map, boundary, isDrawing])

  if (!apiKey) {
    return (
      <div style={{
        height: '384px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb'
      }}>
        <p style={{ color: '#9ca3af' }}>
          Google Maps API key not configured. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      style={{
        height: '384px',
        width: '100%',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
      }}
    />
  )
}
