import { Stack } from 'expo-router'

export default function GardensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add" />
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
