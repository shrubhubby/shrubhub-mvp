import { Tabs } from 'expo-router'
import { Platform, Text } from 'react-native'

export default function TabsLayout() {
  if (Platform.OS === 'web') {
    // On web, use simple stack layout (bottom nav in UI)
    return (
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="plants" />
        <Tabs.Screen name="chat" />
        <Tabs.Screen name="activities" />
        <Tabs.Screen name="settings" />
      </Tabs>
    )
  }

  // On mobile, show native tabs
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => <Text>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: 'Plants',
          tabBarIcon: () => <Text>🌱</Text>,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: () => <Text>💬</Text>,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: () => <Text>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="gardens"
        options={{
          title: 'Gardens',
          tabBarIcon: () => <Text>🏡</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: () => <Text>⚙️</Text>,
        }}
      />
    </Tabs>
  )
}
