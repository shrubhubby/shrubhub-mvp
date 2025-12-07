import React, { useState, useEffect } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { GoogleMapWeb } from './GoogleMapWeb'
import { supabase } from '@/lib/supabase/client'

interface Coordinate {
  latitude: number
  longitude: number
}

interface GardenLocationPickerProps {
  siteId?: string | null
  onLocationChange?: (lat: number, lng: number) => void
  onBoundaryChange?: (polygon: Coordinate[]) => void
  initialLocation?: { latitude: number; longitude: number }
  initialBoundary?: Coordinate[]
}

export function GardenLocationPicker({
  siteId,
  onLocationChange,
  onBoundaryChange,
  initialLocation,
  initialBoundary = []
}: GardenLocationPickerProps) {
  const [location, setLocation] = useState<Coordinate | null>(initialLocation || null)
  const [boundary, setBoundary] = useState<Coordinate[]>(initialBoundary)
  const [siteBoundary, setSiteBoundary] = useState<Coordinate[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isLoadingSite, setIsLoadingSite] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    initialLocation
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : { lat: 39.8283, lng: -98.5795 }
  )
  const [mapZoom, setMapZoom] = useState(initialLocation ? 18 : 4)

  // Load site boundary if siteId is provided
  useEffect(() => {
    if (siteId && typeof window !== 'undefined') {
      loadSiteBoundary()
    }
  }, [siteId])

  const loadSiteBoundary = async () => {
    if (!siteId) return

    setIsLoadingSite(true)
    try {
      const { data: siteData } = await supabase
        .from('sites')
        .select('boundary, location_lat, location_lng')
        .eq('id', siteId)
        .single()

      if (siteData?.boundary) {
        // Parse WKT polygon format to coordinates
        // Format: POLYGON((lng lat, lng lat, ...))
        const coordString = siteData.boundary.match(/\(\((.*?)\)\)/)?.[1]
        if (coordString) {
          const coords = coordString.split(',').map((pair: string) => {
            const [lng, lat] = pair.trim().split(' ').map(Number)
            return { latitude: lat, longitude: lng }
          })
          // Remove last coordinate if it's duplicate of first (closing the polygon)
          if (coords.length > 1) {
            coords.pop()
          }
          setSiteBoundary(coords)

          // Calculate center and zoom to fit site boundary
          if (coords.length > 0 && !initialLocation) {
            const avgLat = coords.reduce((sum, c) => sum + c.latitude, 0) / coords.length
            const avgLng = coords.reduce((sum, c) => sum + c.longitude, 0) / coords.length
            setMapCenter({ lat: avgLat, lng: avgLng })
            setMapZoom(17)
          }
        }
      } else if (siteData?.location_lat && siteData?.location_lng && !initialLocation) {
        // No boundary but has location - zoom to site location
        setMapCenter({ lat: siteData.location_lat, lng: siteData.location_lng })
        setMapZoom(18)
      }
    } catch (error) {
      console.error('Error loading site boundary:', error)
    } finally {
      setIsLoadingSite(false)
    }
  }

  const getCurrentLocation = () => {
    setIsLoadingLocation(true)

    if (!navigator.geolocation) {
      window.alert('Geolocation is not supported by your browser.')
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        setLocation(coords)
        setMapCenter({ lat: coords.latitude, lng: coords.longitude })
        setMapZoom(18)
        onLocationChange?.(coords.latitude, coords.longitude)
        setIsLoadingLocation(false)
      },
      (error) => {
        console.error('Error getting current location:', error)
        window.alert('Failed to get your current location.')
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const toggleDrawing = () => {
    if (isDrawing && boundary.length > 0) {
      setIsDrawing(false)
      window.alert(`Your garden boundary has been defined with ${boundary.length} points.`)
    } else {
      setIsDrawing(true)
      if (boundary.length === 0) {
        setBoundary([])
        onBoundaryChange?.([])
      }
      window.alert('Click on the map to add boundary points. Drag points to adjust. Click "Finish Drawing" when done.')
    }
  }

  const clearBoundary = () => {
    setBoundary([])
    setIsDrawing(false)
    onBoundaryChange?.([])
  }

  return (
    <View className="gap-4">
      <Card>
        <CardContent className="gap-3">
          <Text className="text-sm font-medium text-coal">Garden Boundary</Text>
          <Text className="text-xs text-coal/60">
            {siteId && siteBoundary.length > 0
              ? 'Draw your garden boundary within the site area (shown in green). Click points on the map to define your garden.'
              : 'Define your garden boundary by clicking points on the map.'}
          </Text>

          {isLoadingSite && (
            <View className="py-2">
              <ActivityIndicator size="small" />
              <Text className="text-xs text-coal/60 text-center mt-1">Loading site boundary...</Text>
            </View>
          )}

          <View className="flex-row gap-2">
            <Button
              variant="primary"
              size="sm"
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
              className="flex-1"
            >
              {isLoadingLocation ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-medium">📍 Use My Location</Text>
              )}
            </Button>

            <Button
              variant={isDrawing ? 'primary' : 'outline'}
              size="sm"
              onPress={toggleDrawing}
              className="flex-1"
            >
              <Text className={isDrawing ? 'text-white font-medium' : 'text-coal font-medium'}>
                {isDrawing ? '✓ Finish Drawing' : '✏️ Draw Boundary'}
              </Text>
            </Button>
          </View>

          {boundary.length > 0 && (
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-coal/60">
                {boundary.length} point{boundary.length !== 1 ? 's' : ''} marked
              </Text>
              <Button variant="outline" size="sm" onPress={clearBoundary}>
                <Text className="text-coal font-medium text-xs">Clear Boundary</Text>
              </Button>
            </View>
          )}

          {isDrawing && (
            <View className="bg-forest/10 p-2 rounded-lg">
              <Text className="text-xs text-forest">
                📌 Click on the map to add boundary points
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Google Maps for Web */}
      {typeof window !== 'undefined' && (
        <GoogleMapWeb
          center={mapCenter}
          zoom={mapZoom}
          isDrawing={isDrawing}
          boundary={boundary}
          siteBoundary={siteBoundary}
          onMapClick={(lat, lng) => {
            if (isDrawing) {
              const newBoundary = [...boundary, { latitude: lat, longitude: lng }]
              setBoundary(newBoundary)
              onBoundaryChange?.(newBoundary)
            }
          }}
          onMarkerDrag={(index, lat, lng) => {
            const newBoundary = [...boundary]
            newBoundary[index] = { latitude: lat, longitude: lng }
            setBoundary(newBoundary)
            onBoundaryChange?.(newBoundary)
          }}
        />
      )}
    </View>
  )
}
