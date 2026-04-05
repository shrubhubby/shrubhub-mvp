import React, { useState, useRef } from 'react'
import { View, Text, Image, Pressable, Alert, Platform, Modal } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import * as FileSystem from 'expo-file-system'
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

export interface ExifData {
  dateTaken?: Date
  latitude?: number
  longitude?: number
  make?: string
  model?: string
  locationName?: string
}

export interface CapturedPhoto {
  uri: string
  width?: number
  height?: number
  exif?: ExifData
  base64?: string
  qrCode?: string
}

interface PhotoCaptureProps {
  onPhotoTaken: (photo: CapturedPhoto) => void
  onExifExtracted?: (exif: ExifData) => void
  onQRCodeDetected?: (qrCode: string) => void
  existingPhotoUri?: string
  showPreview?: boolean
  enableMultiple?: boolean
  enableQRScanning?: boolean
  detectQRInPhoto?: boolean
  label?: string
  helpText?: string
}

export function PhotoCapture({
  onPhotoTaken,
  onExifExtracted,
  onQRCodeDetected,
  existingPhotoUri,
  showPreview = true,
  enableMultiple = false,
  enableQRScanning = false,
  detectQRInPhoto = false,
  label = 'Photo',
  helpText,
}: PhotoCaptureProps) {
  const [photoUri, setPhotoUri] = useState<string | undefined>(existingPhotoUri)
  const [isLoading, setIsLoading] = useState(false)
  const [extractedExif, setExtractedExif] = useState<ExifData | null>(null)
  const [detectedQR, setDetectedQR] = useState<string | null>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [isProcessingQR, setIsProcessingQR] = useState(false)
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = useRef<CameraView>(null)

  const parseExifDate = (exifDateTime: string | undefined): Date | undefined => {
    if (!exifDateTime) return undefined
    // EXIF date format: "YYYY:MM:DD HH:MM:SS"
    try {
      const [datePart, timePart] = exifDateTime.split(' ')
      const [year, month, day] = datePart.split(':').map(Number)
      const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0, 0, 0]
      return new Date(year, month - 1, day, hour, minute, second)
    } catch {
      return undefined
    }
  }

  const extractExifFromResult = (result: ImagePicker.ImagePickerAsset): ExifData => {
    const exif: ExifData = {}

    if (result.exif) {
      // Extract date
      const dateTimeOriginal = result.exif.DateTimeOriginal || result.exif.DateTime
      if (dateTimeOriginal) {
        exif.dateTaken = parseExifDate(dateTimeOriginal as string)
      }

      // Extract GPS coordinates
      const lat = result.exif.GPSLatitude
      const lng = result.exif.GPSLongitude
      const latRef = result.exif.GPSLatitudeRef
      const lngRef = result.exif.GPSLongitudeRef

      if (lat !== undefined && lng !== undefined) {
        exif.latitude = latRef === 'S' ? -lat : lat
        exif.longitude = lngRef === 'W' ? -lng : lng
      }

      // Extract device info
      exif.make = result.exif.Make as string
      exif.model = result.exif.Model as string
    }

    return exif
  }

  const pickImage = async (useCamera: boolean) => {
    setIsLoading(true)

    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed to take photos.')
          return
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library access is needed to select photos.')
          return
        }
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: true, // Request EXIF data
        base64: false, // We'll only get base64 when needed for API calls
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options)

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        const exif = extractExifFromResult(asset)

        // If no GPS from EXIF and using camera, try to get current location
        if (!exif.latitude && useCamera) {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status === 'granted') {
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              })
              exif.latitude = location.coords.latitude
              exif.longitude = location.coords.longitude
            }
          } catch (locError) {
            console.log('Could not get location:', locError)
          }
        }

        // Reverse geocode GPS coordinates to get human-readable location
        if (exif.latitude && exif.longitude) {
          try {
            const [address] = await Location.reverseGeocodeAsync({
              latitude: exif.latitude,
              longitude: exif.longitude,
            })
            if (address) {
              const parts = [address.city, address.region, address.country].filter(Boolean)
              exif.locationName = parts.join(', ')
            }
          } catch (geoError) {
            console.log('Could not reverse geocode:', geoError)
          }
        }

        // If no date from EXIF and using camera, use now
        if (!exif.dateTaken && useCamera) {
          exif.dateTaken = new Date()
        }

        setPhotoUri(asset.uri)
        setExtractedExif(exif)

        const photo: CapturedPhoto = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          exif,
        }

        onPhotoTaken(photo)
        if (onExifExtracted && Object.keys(exif).length > 0) {
          onExifExtracted(exif)
        }

        // Detect QR codes in photo if enabled
        if (detectQRInPhoto) {
          detectQRFromPhoto(asset.uri)
        }
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to capture photo. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const clearPhoto = () => {
    setPhotoUri(undefined)
    setExtractedExif(null)
    setDetectedQR(null)
  }

  // QR Code scanning from captured photo using Edge Function
  const detectQRFromPhoto = async (uri: string) => {
    if (!detectQRInPhoto) return

    setIsProcessingQR(true)
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/process-plant-photo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            image: base64,
            operations: ['qr_detection'],
          }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        if (result.qrCodes && result.qrCodes.length > 0) {
          const qrCode = result.qrCodes[0]
          setDetectedQR(qrCode)
          onQRCodeDetected?.(qrCode)
        }
      }
    } catch (error) {
      console.log('QR detection error:', error)
    } finally {
      setIsProcessingQR(false)
    }
  }

  // Real-time QR code scanning handler
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (result.data) {
      setDetectedQR(result.data)
      onQRCodeDetected?.(result.data)
      setShowQRScanner(false)
    }
  }

  const openQRScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission()
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to scan QR codes.')
        return
      }
    }
    setShowQRScanner(true)
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <View className="gap-3">
      {label && (
        <Text className="text-sm font-medium text-coal">{label}</Text>
      )}

      {/* Photo preview or capture buttons */}
      {photoUri && showPreview ? (
        <View className="gap-2">
          <View className="relative">
            <Image
              source={{ uri: photoUri }}
              className="w-full h-48 rounded-lg"
              resizeMode="cover"
            />
            <Pressable
              onPress={clearPhoto}
              className="absolute top-2 right-2 w-8 h-8 bg-coal/70 rounded-full items-center justify-center"
            >
              <Text className="text-white text-lg">×</Text>
            </Pressable>
          </View>

          {/* EXIF data display */}
          {extractedExif && (
            <Card>
              <CardContent className="py-2 px-3">
                <Text className="text-xs font-medium text-coal mb-1">
                  Photo Metadata
                </Text>
                <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                  {extractedExif.dateTaken && (
                    <Text className="text-xs text-coal/60">
                      📅 {formatDate(extractedExif.dateTaken)}
                    </Text>
                  )}
                  {extractedExif.latitude && extractedExif.longitude && (
                    <Text className="text-xs text-coal/60">
                      📍 {extractedExif.locationName || `${extractedExif.latitude.toFixed(4)}, ${extractedExif.longitude.toFixed(4)}`}
                    </Text>
                  )}
                  {extractedExif.make && (
                    <Text className="text-xs text-coal/60">
                      📱 {extractedExif.make} {extractedExif.model || ''}
                    </Text>
                  )}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Replace photo button */}
          <Button
            variant="outline"
            size="sm"
            onPress={() => pickImage(false)}
          >
            <Text className="text-coal">Replace Photo</Text>
          </Button>
        </View>
      ) : (
        <View>
          {/* Empty state / capture buttons */}
          <Pressable
            onPress={() => pickImage(true)}
            disabled={isLoading}
            className="bg-soft border-2 border-dashed border-forest/30 rounded-lg h-40 items-center justify-center active:bg-forest/5"
          >
            {isLoading ? (
              <Text className="text-coal/60">Loading...</Text>
            ) : (
              <>
                <Text className="text-4xl mb-2">📷</Text>
                <Text className="text-forest font-medium">Take Photo</Text>
                <Text className="text-xs text-coal/50 mt-1">
                  or tap below to choose from library
                </Text>
              </>
            )}
          </Pressable>

          <View className="flex-row gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onPress={() => pickImage(false)}
              disabled={isLoading}
              className="flex-1"
            >
              <Text className="text-coal">Choose from Library</Text>
            </Button>
          </View>
        </View>
      )}

      {/* QR Code display */}
      {detectedQR && (
        <Card>
          <CardContent className="py-2 px-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">🔗</Text>
              <View className="flex-1">
                <Text className="text-xs font-medium text-coal">QR Code Detected</Text>
                <Text className="text-xs text-coal/60" numberOfLines={1}>{detectedQR}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* QR Scanning button */}
      {enableQRScanning && !detectedQR && (
        <Button
          variant="outline"
          size="sm"
          onPress={openQRScanner}
        >
          <Text className="text-coal">Scan QR Code</Text>
        </Button>
      )}

      {isProcessingQR && (
        <Text className="text-xs text-coal/50 text-center">Detecting QR codes...</Text>
      )}

      {helpText && (
        <Text className="text-xs text-coal/50">{helpText}</Text>
      )}

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <View className="flex-1 bg-black">
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            <View className="flex-1 items-center justify-center">
              {/* QR scanner overlay */}
              <View className="w-64 h-64 border-2 border-white rounded-lg" />
              <Text className="text-white mt-4 text-center px-4">
                Point camera at QR code
              </Text>
            </View>

            {/* Close button */}
            <Pressable
              onPress={() => setShowQRScanner(false)}
              className="absolute top-12 right-4 w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Text className="text-white text-xl">×</Text>
            </Pressable>
          </CameraView>
        </View>
      </Modal>
    </View>
  )
}
