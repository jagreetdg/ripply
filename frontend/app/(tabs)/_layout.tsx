import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';

import { View, Platform } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Feather>['name'];
  color: string;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Feather
        size={24}
        style={{}}
        {...props}
      />
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6B2FBC',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          borderTopColor: '#E1E1E1',
          ...Platform.select({ ios: { paddingBottom: 0 }, android: { paddingBottom: 0 }, default: {} }),
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: false,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
