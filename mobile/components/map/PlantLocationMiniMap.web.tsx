import React from 'react'
import { View, Text, Image } from 'react-native'

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
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=19&size=600x300&scale=2&maptype=satellite&markers=color:green%7C${latitude},${longitude}&key=${apiKey}`

  return (
    <View className="rounded-lg overflow-hidden">
      <Image
        source={{ uri: staticMapUrl }}
        style={{ width: '100%', height: 150 }}
        resizeMode="cover"
      />
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
