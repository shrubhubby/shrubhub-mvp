'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import {
  Camera,
  Upload,
  Loader2,
  Check,
  ChevronDown,
  MapPin,
  Calendar,
  Sprout,
  X,
  AlertCircle,
  Image as ImageIcon,
  Tag,
  Plus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// --- Types ---

type PhotoType = 'identification' | 'tag_label' | 'general'

interface PlantPhoto {
  id: string
  file: File
  previewUrl: string
  type: PhotoType
}

interface ExifData {
  lat: number | null
  lng: number | null
  timestamp: string | null
  make: string | null
  model: string | null
}

interface IdentificationSuggestion {
  common_name: string
  scientific_name: string
  confidence: number
  plant_master_id?: string | null
}

interface IdentificationResult {
  suggestions: IdentificationSuggestion[]
  message?: string
}

interface TagLabelResult {
  care_instructions: string | null
  brand: string | null
  variety: string | null
  raw_text: string | null
}

type BackgroundStatus = 'idle' | 'running' | 'done' | 'error'

let photoIdCounter = 0
function nextPhotoId() { return `photo_${++photoIdCounter}` }

// --- EXIF extraction (client-side, no dependency) ---

function extractExifFromFile(file: File): Promise<ExifData> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result: ExifData = { lat: null, lng: null, timestamp: null, make: null, model: null }
      try {
        const view = new DataView(e.target!.result as ArrayBuffer)
        // Check for JPEG SOI marker
        if (view.getUint16(0) !== 0xFFD8) {
          resolve(result)
          return
        }
        const length = view.byteLength
        let offset = 2
        while (offset < length) {
          if (view.getUint16(offset) === 0xFFE1) {
            const exif = parseExifBlock(view, offset + 4)
            resolve({ ...result, ...exif })
            return
          }
          offset += 2 + view.getUint16(offset + 2)
        }
      } catch {
        // EXIF parsing failed — not critical
      }
      resolve(result)
    }
    reader.readAsArrayBuffer(file)
  })
}

function parseExifBlock(view: DataView, start: number): Partial<ExifData> {
  const result: Partial<ExifData> = {}
  // Verify Exif header
  const exifHeader = String.fromCharCode(
    view.getUint8(start), view.getUint8(start + 1),
    view.getUint8(start + 2), view.getUint8(start + 3)
  )
  if (exifHeader !== 'Exif') return result

  const tiffStart = start + 6
  const littleEndian = view.getUint16(tiffStart) === 0x4949

  const ifdOffset = view.getUint32(tiffStart + 4, littleEndian)
  const entries = view.getUint16(tiffStart + ifdOffset, littleEndian)

  const gpsData: Record<number, any> = {}
  let gpsIfdOffset: number | null = null

  for (let i = 0; i < entries; i++) {
    const entryOffset = tiffStart + ifdOffset + 2 + i * 12
    const tag = view.getUint16(entryOffset, littleEndian)

    // DateTimeOriginal might be in IFD0 as DateTime (0x0132)
    if (tag === 0x0132) {
      result.timestamp = readExifString(view, tiffStart, entryOffset, littleEndian)
    }
    // Make (0x010F)
    if (tag === 0x010F) {
      result.make = readExifString(view, tiffStart, entryOffset, littleEndian)
    }
    // Model (0x0110)
    if (tag === 0x0110) {
      result.model = readExifString(view, tiffStart, entryOffset, littleEndian)
    }
    // GPS IFD pointer (0x8825)
    if (tag === 0x8825) {
      gpsIfdOffset = view.getUint32(entryOffset + 8, littleEndian)
    }
  }

  // Parse GPS IFD
  if (gpsIfdOffset !== null) {
    const gpsEntries = view.getUint16(tiffStart + gpsIfdOffset, littleEndian)
    for (let i = 0; i < gpsEntries; i++) {
      const entryOffset = tiffStart + gpsIfdOffset + 2 + i * 12
      const tag = view.getUint16(entryOffset, littleEndian)
      const type = view.getUint16(entryOffset + 2, littleEndian)

      if (tag === 1) { // GPSLatitudeRef
        gpsData.latRef = String.fromCharCode(view.getUint8(entryOffset + 8))
      } else if (tag === 3) { // GPSLongitudeRef
        gpsData.lngRef = String.fromCharCode(view.getUint8(entryOffset + 8))
      } else if (tag === 2 && type === 5) { // GPSLatitude
        gpsData.lat = readGpsCoordinate(view, tiffStart, entryOffset, littleEndian)
      } else if (tag === 4 && type === 5) { // GPSLongitude
        gpsData.lng = readGpsCoordinate(view, tiffStart, entryOffset, littleEndian)
      }
    }

    if (gpsData.lat != null && gpsData.lng != null) {
      result.lat = gpsData.latRef === 'S' ? -gpsData.lat : gpsData.lat
      result.lng = gpsData.lngRef === 'W' ? -gpsData.lng : gpsData.lng
    }
  }

  return result
}

function readGpsCoordinate(view: DataView, tiffStart: number, entryOffset: number, littleEndian: boolean): number {
  const valueOffset = view.getUint32(entryOffset + 8, littleEndian)
  const degrees = view.getUint32(tiffStart + valueOffset, littleEndian) / view.getUint32(tiffStart + valueOffset + 4, littleEndian)
  const minutes = view.getUint32(tiffStart + valueOffset + 8, littleEndian) / view.getUint32(tiffStart + valueOffset + 12, littleEndian)
  const seconds = view.getUint32(tiffStart + valueOffset + 16, littleEndian) / view.getUint32(tiffStart + valueOffset + 20, littleEndian)
  return degrees + minutes / 60 + seconds / 3600
}

function readExifString(view: DataView, tiffStart: number, entryOffset: number, littleEndian: boolean): string {
  const count = view.getUint32(entryOffset + 4, littleEndian)
  const valueOffset = count <= 4 ? entryOffset + 8 : tiffStart + view.getUint32(entryOffset + 8, littleEndian)
  let str = ''
  for (let i = 0; i < count - 1; i++) {
    str += String.fromCharCode(view.getUint8(valueOffset + i))
  }
  return str.trim()
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip data URL prefix to get raw base64
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// --- Main Component ---

export default function AddPlantPage() {
  const router = useRouter()
  const plantPhotoRef = useRef<HTMLInputElement>(null)
  const tagPhotoRef = useRef<HTMLInputElement>(null)
  const additionalPhotoRef = useRef<HTMLInputElement>(null)

  // Multi-photo state
  const [photos, setPhotos] = useState<PlantPhoto[]>([])

  // Background process state
  const [idStatus, setIdStatus] = useState<BackgroundStatus>('idle')
  const [exifStatus, setExifStatus] = useState<BackgroundStatus>('idle')
  const [tagStatus, setTagStatus] = useState<BackgroundStatus>('idle')
  const [idResult, setIdResult] = useState<IdentificationResult | null>(null)
  const [idError, setIdError] = useState<string | null>(null)
  const [exifData, setExifData] = useState<ExifData | null>(null)
  const [tagResult, setTagResult] = useState<TagLabelResult | null>(null)
  const [tagError, setTagError] = useState<string | null>(null)

  // Form state
  const [customName, setCustomName] = useState('')
  const [commonName, setCommonName] = useState('')
  const [scientificName, setScientificName] = useState('')
  const [plantMasterId, setPlantMasterId] = useState<string | null>(null)
  const [locationLat, setLocationLat] = useState('')
  const [locationLng, setLocationLng] = useState('')
  const [acquiredDate, setAcquiredDate] = useState(new Date().toISOString().split('T')[0])
  const [locationInGarden, setLocationInGarden] = useState('')
  const [notes, setNotes] = useState('')
  const [gardenId, setGardenId] = useState<string | null>(null)
  const [gardens, setGardens] = useState<{ id: string; name: string }[]>([])

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Suggestion selection
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Derived
  const plantPhoto = photos.find(p => p.type === 'identification')
  const tagPhoto = photos.find(p => p.type === 'tag_label')
  const additionalPhotos = photos.filter(p => p.type === 'general')

  // Load gardens on mount
  useEffect(() => {
    async function loadGardens() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: gardener } = await supabase
        .from('gardeners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      if (!gardener) return

      const { data } = await supabase
        .from('gardens')
        .select('id, name')
        .eq('gardener_id', gardener.id)
        .order('is_primary', { ascending: false })

      if (data && data.length > 0) {
        setGardens(data)
        setGardenId(data[0].id) // Default to primary/first garden
      }
    }
    loadGardens()
  }, [])

  // --- Photo handlers ---

  const addPhoto = useCallback((file: File, type: PhotoType) => {
    const photo: PlantPhoto = {
      id: nextPhotoId(),
      file,
      previewUrl: URL.createObjectURL(file),
      type,
    }
    setPhotos(prev => {
      // For identification and tag_label, replace existing of same type
      if (type === 'identification' || type === 'tag_label') {
        const existing = prev.find(p => p.type === type)
        if (existing) URL.revokeObjectURL(existing.previewUrl)
        return [...prev.filter(p => p.type !== type), photo]
      }
      return [...prev, photo]
    })
    return photo
  }, [])

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id)
      if (photo) URL.revokeObjectURL(photo.previewUrl)
      const isPlant = photo?.type === 'identification'
      if (isPlant) {
        setIdStatus('idle')
        setIdResult(null)
        setIdError(null)
        setExifStatus('idle')
        setExifData(null)
      }
      if (photo?.type === 'tag_label') {
        setTagStatus('idle')
        setTagResult(null)
        setTagError(null)
      }
      return prev.filter(p => p.id !== id)
    })
  }, [])

  // Kick off identification + EXIF when plant photo is added
  const handlePlantPhoto = useCallback(async (file: File) => {
    addPhoto(file, 'identification')
    setIdResult(null)
    setIdError(null)
    setExifData(null)

    // --- EXIF extraction (client-side) ---
    setExifStatus('running')
    extractExifFromFile(file).then((data) => {
      setExifData(data)
      setExifStatus('done')
      if (data.lat != null && data.lng != null) {
        setLocationLat(data.lat.toFixed(6))
        setLocationLng(data.lng.toFixed(6))
      }
      if (data.timestamp) {
        const dateStr = data.timestamp.replace(/^(\d{4}):(\d{2}):(\d{2}).*/, '$1-$2-$3')
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          setAcquiredDate(dateStr)
        }
      }
    }).catch(() => {
      setExifStatus('done')
    })

    // --- Plant identification ---
    setIdStatus('running')
    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/identify-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setIdError(data.error || 'Identification failed')
        setIdStatus('error')
      } else {
        setIdResult(data)
        setIdStatus('done')
        if (data.suggestions?.length > 0) {
          const top = data.suggestions[0]
          if (top.confidence > 0.7) {
            setCommonName(top.common_name)
            setScientificName(top.scientific_name)
            if (top.plant_master_id) setPlantMasterId(top.plant_master_id)
          }
          setShowSuggestions(true)
        }
      }
    } catch {
      setIdError('Could not reach identification service')
      setIdStatus('error')
    }
  }, [addPhoto])

  // Kick off AI extraction when tag/label photo is added
  const handleTagPhoto = useCallback(async (file: File) => {
    addPhoto(file, 'tag_label')
    setTagResult(null)
    setTagError(null)
    setTagStatus('running')

    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/extract-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTagError(data.error || 'Could not read tag')
        setTagStatus('error')
      } else {
        setTagResult(data)
        setTagStatus('done')
      }
    } catch {
      setTagError('Could not reach tag reading service')
      setTagStatus('error')
    }
  }, [addPhoto])

  const handleFileInput = (type: PhotoType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (type === 'identification') handlePlantPhoto(file)
    else if (type === 'tag_label') handleTagPhoto(file)
    else addPhoto(file, 'general')
    e.target.value = '' // Allow re-selecting same file
  }

  const selectSuggestion = (s: IdentificationSuggestion) => {
    setCommonName(s.common_name)
    setScientificName(s.scientific_name)
    if (s.plant_master_id) setPlantMasterId(s.plant_master_id)
    setShowSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gardenId || !commonName) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garden_id: gardenId,
          common_name: commonName,
          custom_name: customName || null,
          plant_master_id: plantMasterId,
          location_in_garden: locationInGarden || null,
          location_lat: locationLat ? parseFloat(locationLat) : null,
          location_lng: locationLng ? parseFloat(locationLng) : null,
          acquired_date: acquiredDate,
          acquisition_notes: notes || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add plant')
      }

      const { plant } = await res.json()

      // Upload all photos and create plant_photos records
      if (photos.length > 0 && plant?.id) {
        const supabase = createClient()
        const now = new Date().toISOString()

        await Promise.all(photos.map(async (photo, index) => {
          const ext = photo.file.name.split('.').pop() || 'jpg'
          const storagePath = `plants/${plant.id}/${photo.type}_${Date.now()}_${index}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('plant-photos')
            .upload(storagePath, photo.file)

          if (!uploadError) {
            const insertData: Record<string, any> = {
              plant_id: plant.id,
              storage_bucket: 'plant-photos',
              storage_path: storagePath,
              taken_at: acquiredDate,
              uploaded_at: now,
              mime_type: photo.file.type,
              file_size_bytes: photo.file.size,
              photo_type: photo.type,
              is_primary: photo.type === 'identification',
              display_order: index,
            }
            // Attach tag extraction results as identification_data
            if (photo.type === 'tag_label' && tagResult) {
              insertData.identification_data = tagResult
            }
            await supabase.from('plant_photos').insert(insertData)
          }
        }))
      }

      router.push('/plants')
    } catch (err: any) {
      setSubmitError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          &larr; Back
        </Button>
        <h1 className="text-2xl font-bold text-coal">Add New Plant</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photos section */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-coal">
              <Camera size={18} className="inline mr-2 -mt-0.5" />
              Photos
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Plant photo slot */}
              <PhotoSlot
                photo={plantPhoto}
                label="Plant Photo"
                sublabel="AI will identify it"
                icon={<Camera size={24} className="text-forest" />}
                accentClass="bg-forest/10 border-forest/30 hover:border-forest"
                onAdd={() => plantPhotoRef.current?.click()}
                onRemove={(id) => removePhoto(id)}
                statusPills={
                  <>
                    <StatusPill status={idStatus} label="Identifying" doneLabel="Identified" errorLabel="ID failed" />
                    <StatusPill status={exifStatus} label="Metadata" doneLabel="Metadata read" errorLabel="No metadata" />
                  </>
                }
              />

              {/* Tag / Label photo slot */}
              <PhotoSlot
                photo={tagPhoto}
                label="Tag / Label"
                sublabel="We'll read care instructions"
                icon={<Tag size={24} className="text-ocean-deep" />}
                accentClass="bg-ocean-deep/10 border-ocean-deep/30 hover:border-ocean-deep"
                onAdd={() => tagPhotoRef.current?.click()}
                onRemove={(id) => removePhoto(id)}
                statusPills={
                  <StatusPill status={tagStatus} label="Reading label" doneLabel="Label read" errorLabel="Read failed" />
                }
              />
            </div>

            {/* Additional photos */}
            {additionalPhotos.length > 0 && (
              <div>
                <p className="text-xs font-medium text-coal/50 mb-2">Additional Photos</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {additionalPhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-soft">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.previewUrl} alt="Additional" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 w-6 h-6 bg-coal/70 text-white rounded-full flex items-center justify-center hover:bg-coal"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => additionalPhotoRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-soft hover:border-coal/30 flex items-center justify-center transition-colors"
                  >
                    <Plus size={20} className="text-coal/30" />
                  </button>
                </div>
              </div>
            )}

            {/* Add more photos link (when no additional yet) */}
            {additionalPhotos.length === 0 && (
              <button
                type="button"
                onClick={() => additionalPhotoRef.current?.click()}
                className="w-full text-sm text-ocean-deep font-medium py-2 hover:underline"
              >
                <Plus size={14} className="inline -mt-0.5 mr-1" />
                Add more photos
              </button>
            )}

            {/* Hidden file inputs */}
            <input ref={plantPhotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput('identification')} />
            <input ref={tagPhotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput('tag_label')} />
            <input ref={additionalPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput('general')} />
          </CardContent>
        </Card>

        {/* Identification suggestions */}
        {idResult && idResult.suggestions && idResult.suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <button
                type="button"
                className="flex items-center justify-between w-full"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <h2 className="text-lg font-semibold text-coal">
                  <Sprout size={18} className="inline mr-2 -mt-0.5" />
                  Identification Results
                </h2>
                <ChevronDown size={18} className={`text-coal/50 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
              </button>
            </CardHeader>
            {showSuggestions && (
              <CardContent className="p-0">
                <div className="divide-y divide-soft/50">
                  {idResult.suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-soft/50 transition-colors ${
                        commonName === s.common_name && scientificName === s.scientific_name
                          ? 'bg-forest/5'
                          : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-coal">{s.common_name}</p>
                        <p className="text-xs text-coal/50 italic">{s.scientific_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          s.confidence > 0.7
                            ? 'bg-healthy/15 text-healthy'
                            : s.confidence > 0.4
                            ? 'bg-attention/15 text-attention'
                            : 'bg-coal/10 text-coal/60'
                        }`}>
                          {Math.round(s.confidence * 100)}%
                        </span>
                        {commonName === s.common_name && scientificName === s.scientific_name && (
                          <Check size={16} className="text-forest" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* ID error notice */}
        {idStatus === 'error' && (
          <div className="flex items-start gap-2 px-4 py-3 bg-attention/10 rounded-lg text-sm text-coal">
            <AlertCircle size={16} className="text-attention mt-0.5 flex-shrink-0" />
            <span>{idError || 'Identification failed.'} You can enter the plant details manually below.</span>
          </div>
        )}

        {/* EXIF data notice */}
        {exifData && (exifData.lat || exifData.timestamp) && (
          <div className="flex items-start gap-2 px-4 py-3 bg-ocean-mist/50 rounded-lg text-sm text-coal">
            <ImageIcon size={16} className="text-ocean-deep mt-0.5 flex-shrink-0" />
            <span>
              Auto-filled from photo:
              {exifData.lat && ` location (${exifData.lat.toFixed(4)}, ${exifData.lng?.toFixed(4)})`}
              {exifData.lat && exifData.timestamp && ','}
              {exifData.timestamp && ` date (${exifData.timestamp.split(' ')[0].replace(/:/g, '-')})`}
              {exifData.make && `, shot on ${exifData.make} ${exifData.model || ''}`}
            </span>
          </div>
        )}

        {/* Tag / Label extraction results */}
        {tagResult && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-coal">
                <Tag size={18} className="inline mr-2 -mt-0.5" />
                From Tag / Label
              </h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {tagResult.brand && (
                <div><span className="font-medium text-coal">Brand:</span> <span className="text-coal/70">{tagResult.brand}</span></div>
              )}
              {tagResult.variety && (
                <div><span className="font-medium text-coal">Variety:</span> <span className="text-coal/70">{tagResult.variety}</span></div>
              )}
              {tagResult.care_instructions && (
                <div>
                  <span className="font-medium text-coal">Care Instructions:</span>
                  <p className="text-coal/70 mt-1 whitespace-pre-line bg-soft/50 rounded-lg p-3">{tagResult.care_instructions}</p>
                </div>
              )}
              {tagResult.raw_text && !tagResult.care_instructions && (
                <div>
                  <span className="font-medium text-coal">Text found:</span>
                  <p className="text-coal/70 mt-1 whitespace-pre-line bg-soft/50 rounded-lg p-3">{tagResult.raw_text}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tagStatus === 'error' && (
          <div className="flex items-start gap-2 px-4 py-3 bg-attention/10 rounded-lg text-sm text-coal">
            <AlertCircle size={16} className="text-attention mt-0.5 flex-shrink-0" />
            <span>{tagError || 'Could not read tag.'} You can enter care details manually.</span>
          </div>
        )}

        {/* Step 2: Plant details form */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-coal">Plant Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Garden selector */}
            {gardens.length > 1 && (
              <div className="w-full">
                <label className="block text-sm font-medium text-coal mb-1">Garden</label>
                <select
                  value={gardenId || ''}
                  onChange={(e) => setGardenId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-soft bg-white text-coal focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest transition-all duration-200"
                >
                  {gardens.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            <Input
              label="Nickname"
              placeholder="e.g., Big Bertha, Kitchen Basil"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />

            <Input
              label="Common Name"
              placeholder="e.g., Monstera Deliciosa"
              value={commonName}
              onChange={(e) => setCommonName(e.target.value)}
              required
            />

            <Input
              label="Scientific Name"
              placeholder="e.g., Monstera deliciosa"
              value={scientificName}
              onChange={(e) => setScientificName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date Acquired"
                type="date"
                value={acquiredDate}
                onChange={(e) => setAcquiredDate(e.target.value)}
                icon={<Calendar size={16} />}
              />
              <Input
                label="Location in Garden"
                placeholder="e.g., Back fence, Pot #3"
                value={locationInGarden}
                onChange={(e) => setLocationInGarden(e.target.value)}
              />
            </div>

            {/* GPS coordinates — auto-filled from EXIF or manual */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                placeholder="e.g., 37.7749"
                value={locationLat}
                onChange={(e) => setLocationLat(e.target.value)}
                icon={<MapPin size={16} />}
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                placeholder="e.g., -122.4194"
                value={locationLng}
                onChange={(e) => setLocationLng(e.target.value)}
              />
            </div>

            <Textarea
              label="Notes"
              placeholder="Anything notable about this plant..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        {submitError && (
          <div className="flex items-start gap-2 px-4 py-3 bg-urgent/10 rounded-lg text-sm text-urgent">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !commonName || !gardenId}
            className="flex-1"
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="animate-spin" /> Adding...</>
            ) : (
              <><Sprout size={18} /> Add to Inventory</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// --- Photo slot component ---

function PhotoSlot({ photo, label, sublabel, icon, accentClass, onAdd, onRemove, statusPills }: {
  photo?: PlantPhoto
  label: string
  sublabel: string
  icon: React.ReactNode
  accentClass: string
  onAdd: () => void
  onRemove: (id: string) => void
  statusPills?: React.ReactNode
}) {
  if (photo) {
    return (
      <div className="relative">
        <div className="aspect-square rounded-lg overflow-hidden bg-soft relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.previewUrl} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(photo.id)}
            className="absolute top-2 right-2 w-7 h-7 bg-coal/70 text-white rounded-full flex items-center justify-center hover:bg-coal"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-coal/60 to-transparent px-2 pb-2 pt-6">
            <p className="text-xs font-medium text-white">{label}</p>
          </div>
        </div>
        {statusPills && (
          <div className="flex flex-wrap gap-1.5 mt-2">{statusPills}</div>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${accentClass}`}
    >
      <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div className="text-center px-2">
        <p className="text-sm font-medium text-coal">{label}</p>
        <p className="text-xs text-coal/50">{sublabel}</p>
      </div>
    </button>
  )
}

// --- Status pill for background processes ---

function StatusPill({ status, label, doneLabel, errorLabel }: {
  status: BackgroundStatus
  label: string
  doneLabel: string
  errorLabel: string
}) {
  if (status === 'idle') return null

  const config = {
    running: { bg: 'bg-ocean-mist', text: 'text-ocean-deep', icon: <Loader2 size={12} className="animate-spin" />, display: label },
    done: { bg: 'bg-healthy/15', text: 'text-healthy', icon: <Check size={12} />, display: doneLabel },
    error: { bg: 'bg-attention/15', text: 'text-attention', icon: <AlertCircle size={12} />, display: errorLabel },
  }[status]

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
      {config.icon} {config.display}
    </span>
  )
}
