import React, { useState, useEffect, useRef } from 'react'
import { View, TextInput } from 'react-native'

interface AddressPickerProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void
  placeholder?: string
}

export function AddressPicker({ onAddressSelect, placeholder = 'Search for an address...' }: AddressPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey || typeof window === 'undefined' || !inputRef.current) return

    // Wait for Google Maps to load
    const initAutocomplete = () => {
      if (!window.google?.maps?.places) {
        setTimeout(initAutocomplete, 100)
        return
      }

      const autocompleteInstance = new google.maps.places.Autocomplete(
        inputRef.current as HTMLInputElement,
        {
          types: ['address', 'geocode'],
          fields: ['formatted_address', 'geometry', 'name']
        }
      )

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace()
        
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          const address = place.formatted_address || place.name || ''
          
          onAddressSelect(address, lat, lng)
        }
      })

      setAutocomplete(autocompleteInstance)
    }

    initAutocomplete()

    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete)
      }
    }
  }, [apiKey])

  return (
    <View>
      <input
        ref={inputRef as any}
        type="text"
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          outline: 'none',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#228B1B'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e5e7eb'
        }}
      />
    </View>
  )
}
