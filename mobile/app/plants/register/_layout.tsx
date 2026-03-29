import { Stack } from 'expo-router'
import { View } from 'react-native'

export default function RegisterLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F2F4F4' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="bulk-clones" />
      <Stack.Screen name="clone" />
      <Stack.Screen name="field-extraction" />
      <Stack.Screen name="purchase" />
      <Stack.Screen name="gift" />
      <Stack.Screen name="exchange" />
      <Stack.Screen name="seed" />
      <Stack.Screen name="volunteer" />
      <Stack.Screen name="custom" />
    </Stack>
  )
}
