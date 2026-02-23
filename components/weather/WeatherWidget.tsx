import React, { useState, useEffect } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Card, CardContent } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase/client'

interface WeatherData {
  temperature_c: number
  temperature_min_c?: number
  temperature_max_c?: number
  precipitation_mm: number
  humidity_percent?: number
  soil_temperature_c?: number
  frost_risk: boolean
  observed_at: string
}

interface WeatherWidgetProps {
  lat: number
  lng: number
  compact?: boolean
  onPress?: () => void
}

export function WeatherWidget({ lat, lng, compact = false, onPress }: WeatherWidgetProps) {
  const [current, setCurrent] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<WeatherData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWeather()
  }, [lat, lng])

  const fetchWeather = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Fetch current weather
      const currentRes = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/fetch-weather`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ lat, lng, type: 'current' }),
        }
      )

      if (currentRes.ok) {
        const { data } = await currentRes.json()
        setCurrent(data)
      }

      // Fetch forecast
      const forecastRes = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/fetch-weather`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ lat, lng, type: 'forecast' }),
        }
      )

      if (forecastRes.ok) {
        const { data } = await forecastRes.json()
        setForecast(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Error fetching weather:', err)
      setError('Unable to load weather')
    } finally {
      setIsLoading(false)
    }
  }

  const celsiusToFahrenheit = (c: number) => Math.round((c * 9/5) + 32)

  const getWeatherEmoji = (temp: number, frostRisk: boolean, precipitation: number) => {
    if (frostRisk) return '❄️'
    if (precipitation > 5) return '🌧️'
    if (temp > 30) return '☀️'
    if (temp > 20) return '🌤️'
    if (temp > 10) return '⛅'
    return '🌥️'
  }

  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-3">
          <Text className="text-coal/50 text-center">Loading weather...</Text>
        </CardContent>
      </Card>
    )
  }

  if (error || !current) {
    return (
      <Card>
        <CardContent className="py-3">
          <Text className="text-coal/50 text-center">{error || 'Weather unavailable'}</Text>
        </CardContent>
      </Card>
    )
  }

  const Component = onPress ? Pressable : View

  if (compact) {
    return (
      <Component onPress={onPress}>
        <Card>
          <CardContent className="py-2 px-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">
                  {getWeatherEmoji(current.temperature_c, current.frost_risk, current.precipitation_mm)}
                </Text>
                <Text className="text-lg font-semibold text-coal">
                  {celsiusToFahrenheit(current.temperature_c)}°F
                </Text>
              </View>
              {current.frost_risk && (
                <View className="bg-blue-100 px-2 py-1 rounded-full">
                  <Text className="text-xs text-blue-700 font-medium">Frost Risk</Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>
      </Component>
    )
  }

  return (
    <Component onPress={onPress}>
      <Card>
        <CardContent>
          {/* Current weather */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <Text className="text-4xl">
                {getWeatherEmoji(current.temperature_c, current.frost_risk, current.precipitation_mm)}
              </Text>
              <View>
                <Text className="text-2xl font-bold text-coal">
                  {celsiusToFahrenheit(current.temperature_c)}°F
                </Text>
                {current.humidity_percent && (
                  <Text className="text-xs text-coal/60">
                    Humidity: {current.humidity_percent}%
                  </Text>
                )}
              </View>
            </View>
            <View className="items-end">
              {current.frost_risk && (
                <View className="bg-blue-100 px-2 py-1 rounded-full mb-1">
                  <Text className="text-xs text-blue-700 font-medium">Frost Risk</Text>
                </View>
              )}
              {current.soil_temperature_c !== undefined && (
                <Text className="text-xs text-coal/60">
                  Soil: {celsiusToFahrenheit(current.soil_temperature_c)}°F
                </Text>
              )}
            </View>
          </View>

          {/* Forecast */}
          {forecast.length > 0 && (
            <View className="flex-row justify-between border-t border-soft pt-3">
              {forecast.slice(0, 5).map((day, i) => (
                <View key={i} className="items-center">
                  <Text className="text-xs text-coal/60 mb-1">{formatDay(day.observed_at)}</Text>
                  <Text className="text-lg">
                    {getWeatherEmoji(day.temperature_c, day.frost_risk, day.precipitation_mm)}
                  </Text>
                  <Text className="text-xs text-coal font-medium">
                    {day.temperature_max_c !== undefined
                      ? celsiusToFahrenheit(day.temperature_max_c)
                      : celsiusToFahrenheit(day.temperature_c)}°
                  </Text>
                  {day.frost_risk && (
                    <View className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                  )}
                </View>
              ))}
            </View>
          )}
        </CardContent>
      </Card>
    </Component>
  )
}
