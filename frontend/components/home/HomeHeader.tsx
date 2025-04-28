import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export function HomeHeader() {
  const router = useRouter();

  const handleProfilePress = () => {
    router.push("/profile/jamiejones");
  };

  const handleNotificationsPress = () => {
    router.push("/notifications");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
        <View style={styles.profilePicture}>
          <Text style={styles.profileInitial}>U</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Ripply</Text>
      </View>
      
      <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationsPress}>
        <Feather name="bell" size={22} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: "100%",
    backgroundColor: "#FFFFFF",
  },
  profileButton: {
    padding: 4,
  },
  profilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6B2FBC",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6B2FBC",
  },
  notificationButton: {
    padding: 4,
  },
});
