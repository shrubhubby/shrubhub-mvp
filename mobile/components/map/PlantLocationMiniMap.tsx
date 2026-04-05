import React from 'react'
import { View, Text } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'

interface PlantLocationMiniMapProps {
  latitude: number
  longitude: number
  locationName?: string
}

export function PlantLocationMiniMap({
  latitude,
  longitude,
  locationName,
}: PlantLocationMiniMapProps) {
  return (
    <View className="rounded-lg overflow-hidden">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ width: '100%', height: 150 }}
        mapType="satellite"
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.0005,
          longitudeDelta: 0.0005,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          pinColor="#228B1B"
        />
      </MapView>
      {locationName && (
        <View className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
          <Text className="text-white text-xs" numberOfLines={1}>
            {locationName}
          </Text>
        </View>
      )}
    </View>
  )
}
