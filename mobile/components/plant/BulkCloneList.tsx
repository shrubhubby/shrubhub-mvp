import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export interface CloneData {
  index: number
  name: string
  editableId: string
  photoUri?: string
  qrCode?: string
  notes?: string
}

interface BulkCloneListProps {
  clones: CloneData[]
  motherPlantName: string
  onUpdateClone: (index: number, updates: Partial<CloneData>) => void
  onRemoveClone: (index: number) => void
}

export function BulkCloneList({
  clones,
  motherPlantName,
  onUpdateClone,
  onRemoveClone,
}: BulkCloneListProps) {
  const [editingClone, setEditingClone] = useState<CloneData | null>(null)
  const [editName, setEditName] = useState('')
  const [editId, setEditId] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const openEditModal = (clone: CloneData) => {
    setEditingClone(clone)
    setEditName(clone.name)
    setEditId(clone.editableId)
    setEditNotes(clone.notes || '')
  }

  const saveEdit = () => {
    if (!editingClone) return

    onUpdateClone(editingClone.index, {
      name: editName,
      editableId: editId,
      notes: editNotes,
    })
    setEditingClone(null)
  }

  const renderCloneItem = ({ item }: { item: CloneData }) => {
    const hasPhoto = !!item.photoUri
    const hasQR = !!item.qrCode

    return (
      <Pressable onPress={() => openEditModal(item)} className="mb-2">
        <Card>
          <CardContent className="flex-row items-center gap-3 py-3">
            {/* Photo or placeholder */}
            {hasPhoto ? (
              <Image
                source={{ uri: item.photoUri }}
                className="w-16 h-16 rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <View className="w-16 h-16 bg-soft rounded-lg items-center justify-center">
                <Text className="text-2xl">🌱</Text>
              </View>
            )}

            {/* Clone info */}
            <View className="flex-1">
              <Text className="font-semibold text-coal">{item.name}</Text>
              <View className="flex-row items-center gap-2 mt-1">
                <Text className="text-xs text-coal/60">
                  ID: {item.editableId || 'Auto-generated'}
                </Text>
                {hasQR && (
                  <View className="bg-forest/10 px-2 py-0.5 rounded">
                    <Text className="text-xs text-forest">QR</Text>
                  </View>
                )}
              </View>
              {item.notes && (
                <Text className="text-xs text-coal/50 mt-1" numberOfLines={1}>
                  {item.notes}
                </Text>
              )}
            </View>

            {/* Edit indicator */}
            <Text className="text-forest">Edit</Text>
          </CardContent>
        </Card>
      </Pressable>
    )
  }

  return (
    <View className="flex-1">
      {/* Header with count */}
      <View className="px-4 py-3 bg-soft border-b border-soft/50">
        <Text className="text-sm font-medium text-coal">
          {clones.length} Clone{clones.length !== 1 ? 's' : ''} from {motherPlantName}
        </Text>
        <Text className="text-xs text-coal/60">
          Tap any clone to edit its name or ID
        </Text>
      </View>

      {/* Clone list */}
      <FlatList
        data={clones}
        keyExtractor={(item) => `clone-${item.index}`}
        renderItem={renderCloneItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="py-8 items-center">
            <Text className="text-coal/60">No clones added yet</Text>
          </View>
        }
      />

      {/* Edit modal */}
      <Modal
        visible={!!editingClone}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingClone(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-soft"
        >
          <View className="flex-1">
            {/* Modal header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-soft/50 bg-white">
              <Pressable onPress={() => setEditingClone(null)}>
                <Text className="text-forest">Cancel</Text>
              </Pressable>
              <Text className="font-semibold text-coal">Edit Clone</Text>
              <Pressable onPress={saveEdit}>
                <Text className="text-forest font-semibold">Save</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-4">
              {editingClone && (
                <View className="gap-4">
                  {/* Photo preview if exists */}
                  {editingClone.photoUri && (
                    <View className="items-center mb-2">
                      <Image
                        source={{ uri: editingClone.photoUri }}
                        className="w-32 h-32 rounded-lg"
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {/* Clone name */}
                  <Input
                    label="Clone Name"
                    value={editName}
                    onChangeText={setEditName}
                    placeholder={`${motherPlantName} Clone #${editingClone.index + 1}`}
                  />

                  {/* Editable ID */}
                  <View>
                    <Input
                      label="Plant ID"
                      value={editId}
                      onChangeText={setEditId}
                      placeholder="Enter ID or leave blank for auto"
                      autoCapitalize="none"
                    />
                    <Text className="text-xs text-coal/50 mt-1">
                      This ID will help you identify this specific plant later
                      {editingClone.qrCode && (
                        <Text className="text-forest"> (detected from QR code)</Text>
                      )}
                    </Text>
                  </View>

                  {/* Notes */}
                  <Input
                    label="Notes (optional)"
                    value={editNotes}
                    onChangeText={setEditNotes}
                    placeholder="e.g., 'Tray A, Row 1' or 'Red tag'"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />

                  {/* Remove clone button */}
                  <View className="mt-4 pt-4 border-t border-soft">
                    <Button
                      variant="outline"
                      onPress={() => {
                        onRemoveClone(editingClone.index)
                        setEditingClone(null)
                      }}
                    >
                      <Text className="text-urgent">Remove Clone</Text>
                    </Button>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

// Helper function to generate default clone names
export function generateCloneName(
  motherPlantName: string,
  cloneNumber: number
): string {
  // Remove "Clone" from the mother name if it exists to avoid "Clone Clone #1"
  const baseName = motherPlantName.replace(/\s*Clone\s*(#?\d+)?$/i, '').trim()
  return `${baseName} Clone #${cloneNumber}`
}

// Helper to generate initial clone list
export function generateCloneList(
  count: number,
  motherPlantName: string
): CloneData[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    name: generateCloneName(motherPlantName, i + 1),
    editableId: '',
    photoUri: undefined,
    qrCode: undefined,
    notes: undefined,
  }))
}
