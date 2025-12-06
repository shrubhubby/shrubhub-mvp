import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { GoogleMapWeb } from './GoogleMapWeb'
import { AddressPicker } from './AddressPicker'

interface Coordinate {
  latitude: number
  longitude: number
}

interface SiteLocationPickerProps {
  onLocationChange?: (lat: number, lng: number) => void
  onBoundaryChange?: (polygon: Coordinate[]) => void
  initialLocation?: { latitude: number; longitude: number }
  initialBoundary?: Coordinate[]
}

export function SiteLocationPicker({
  onLocationChange,
  onBoundaryChange,
  initialLocation,
  initialBoundary = []
}: SiteLocationPickerProps) {
  const [location, setLocation] = useState<Coordinate | null>(
    initialLocation || null
  )
  const [boundary, setBoundary] = useState<Coordinate[]>(initialBoundary)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    initialLocation
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : { lat: 39.8283, lng: -98.5795 }
  )
  const [mapZoom, setMapZoom] = useState(initialLocation ? 18 : 4)

  const getCurrentLocation = () => {
    setIsLoadingLocation(true)

    // Use browser's geolocation API for web
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
        let message = 'Failed to get your current location.\n\n'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += 'Please allow location access in your browser settings.\n\n'
            message += 'On iOS Chrome:\n'
            message += '1. Tap the "AA" or lock icon in the address bar\n'
            message += '2. Tap "Website Settings"\n'
            message += '3. Change Location to "Allow"'
            break
          case error.POSITION_UNAVAILABLE:
            message += 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            message += 'The request to get your location timed out.'
            break
          default:
            message += 'An unknown error occurred.'
        }

        // Use browser alert instead of React Native Alert for web
        if (typeof window !== 'undefined') {
          window.alert(message)
        }
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
      // Finish drawing
      setIsDrawing(false)
      window.alert(`Your site boundary has been defined with ${boundary.length} points.`)
    } else {
      // Start drawing
      setIsDrawing(true)
      if (boundary.length === 0) {
        setBoundary([])
        onBoundaryChange?.([])
      }
      window.alert('Click on the map to add boundary points. You can drag any point to adjust its position. Click "Finish Drawing" when done.')
    }
  }

  const clearBoundary = () => {
    setBoundary([])
    setIsDrawing(false)
    onBoundaryChange?.([])
  }

  const handleAddressSelect = (address: string, lat: number, lng: number) => {
    const coords = { latitude: lat, longitude: lng }
    setLocation(coords)
    setMapCenter({ lat, lng })
    setMapZoom(18)
    onLocationChange?.(lat, lng)
  }

  return (
    <View className="gap-4">
      <Card>
        <CardContent className="gap-3">
          <Text className="text-sm font-medium text-coal">Site Location & Boundary</Text>
          <Text className="text-xs text-coal/60">
            Search for an address, use GPS, or click on the map. Then draw a boundary by clicking points.
          </Text>

          {/* Address Search */}
          {typeof window !== 'undefined' && (
            <AddressPicker
              onAddressSelect={handleAddressSelect}
              placeholder="Search for an address..."
            />
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

      <Card>
        <CardContent>
          <Text className="text-xs text-coal/60">
            💡 <Text className="font-semibold">Tip:</Text>{' '}
            For full satellite imagery and polygon drawing, use the mobile app. Web maps are coming soon!
          </Text>
        </CardContent>
      </Card>
    </View>
  )
}
