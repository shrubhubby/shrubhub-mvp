import React, { useEffect } from 'react'
import { View } from 'react-native'
import { useRouter, Redirect } from 'expo-router'

// This page now redirects to the new registration flow
// The AcquisitionMethodPicker lets users choose how they acquired the plant
export default function AddPlantScreen() {
  return <Redirect href="/plants/register" />
}
