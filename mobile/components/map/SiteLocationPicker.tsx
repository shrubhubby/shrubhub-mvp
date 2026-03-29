import React, { useState, useRef, useEffect } from 'react'
import { View, Text, Alert, ActivityIndicator } from 'react-native'
import * as Location from 'expo-location'
import MapView, { Polygon, Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

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
  const mapRef = useRef<MapView>(null)
  const [location, setLocation] = useState<Coordinate | null>(
    initialLocation || null
  )
  const [boundary, setBoundary] = useState<Coordinate[]>(initialBoundary)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission()
  }, [])

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to set your site location automatically.'
        )
      }
    } catch (error) {
      console.error('Error requesting location permission:', error)
    }
  }

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true)
    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant location permission to use this feature.'
        )
        setIsLoadingLocation(false)
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      })

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }

      setLocation(coords)
      onLocationChange?.(coords.latitude, coords.longitude)

      // Animate to location with maximum zoom
      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta: 0.001, // Very close zoom (about 100 meters)
        longitudeDelta: 0.001,
      }, 1000)

    } catch (error) {
      console.error('Error getting current location:', error)
      Alert.alert('Error', 'Failed to get your current location. Please try again.')
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const handleMapPress = (event: any) => {
    if (!isDrawing) return

    const coordinate = event.nativeEvent.coordinate
    const newBoundary = [...boundary, coordinate]
    setBoundary(newBoundary)
    onBoundaryChange?.(newBoundary)
  }

  const handleMarkerDrag = (index: number, coordinate: Coordinate) => {
    const newBoundary = [...boundary]
    newBoundary[index] = coordinate
    setBoundary(newBoundary)
    onBoundaryChange?.(newBoundary)
  }

  const toggleDrawing = () => {
    if (isDrawing && boundary.length > 0) {
      // Finish drawing
      setIsDrawing(false)
      Alert.alert('Boundary Set', `Your site boundary has been defined with ${boundary.length} points.`)
    } else {
      // Start drawing
      setIsDrawing(true)
      if (boundary.length === 0) {
        setBoundary([])
        onBoundaryChange?.([])
      }
      Alert.alert(
        'Draw Boundary',
        'Tap on the map to add boundary points. You can drag any point to adjust its position. Tap "Finish Drawing" when done.'
      )
    }
  }

  const clearBoundary = () => {
    setBoundary([])
    setIsDrawing(false)
    onBoundaryChange?.([])
  }

  const defaultRegion = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
      }
    : {
        // Default to center of US if no location
        latitude: 39.8283,
        longitude: -98.5795,
        latitudeDelta: 40,
        longitudeDelta: 40,
      }

  return (
    <View className="gap-4">
      <Card>
        <CardContent className="gap-3">
          <Text className="text-sm font-medium text-coal">Site Location & Boundary</Text>
          <Text className="text-xs text-coal/60">
            Set your site location using GPS, then draw a boundary by tapping points on the map
          </Text>

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
                📌 Tap on the map to add boundary points
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <View className="h-96 rounded-xl overflow-hidden border border-soft">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={defaultRegion}
          mapType="satellite"
          showsUserLocation
          showsMyLocationButton
          onPress={handleMapPress}
          maxZoomLevel={20}
        >
          {/* Center marker */}
          {location && (
            <Marker
              coordinate={location}
              title="Site Center"
              description="Your site location"
              pinColor="red"
            />
          )}

          {/* Boundary polygon */}
          {boundary.length > 2 && (
            <Polygon
              coordinates={boundary}
              strokeColor="#228B1B"
              strokeWidth={3}
              fillColor="rgba(34, 139, 27, 0.3)"
            />
          )}

          {/* Boundary points - draggable to adjust position */}
          {boundary.map((coord, index) => (
            <Marker
              key={index}
              coordinate={coord}
              anchor={{ x: 0.5, y: 0.5 }}
              draggable
              onDragEnd={(e) => handleMarkerDrag(index, e.nativeEvent.coordinate)}
            >
              <View className="w-5 h-5 bg-forest rounded-full border-2 border-white shadow-lg" />
            </Marker>
          ))}
        </MapView>
      </View>

      <Card>
        <CardContent>
          <Text className="text-xs text-coal/60">
            💡 <Text className="font-semibold">Tip:</Text>{' '}
            Use satellite view to identify your exact property boundaries. Tap to add boundary points, then drag any point to adjust its position. The hardiness zone will be automatically detected from your location.
          </Text>
        </CardContent>
      </Card>
    </View>
  )
}
