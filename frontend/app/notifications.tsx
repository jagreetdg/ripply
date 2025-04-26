import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const handleBackPress = () => {
    router.back();
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "Notifications",
          headerTitleStyle: styles.headerTitle,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: "#FFFFFF",
          },
        }} 
      />
      <View style={styles.content}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#6B2FBC",
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#6B2FBC",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
  },
});
