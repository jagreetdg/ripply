import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";

const ProfileFloatingActionButton: React.FC = () => {
	const { colors } = useTheme();
	const router = useRouter();
	const insets = useSafeAreaInsets();

	return (
		<TouchableOpacity
			style={[
				styles.floatingActionButton,
				{
					bottom: insets.bottom + 16,
					backgroundColor: colors.tint,
					shadowColor: colors.shadow,
				},
			]}
			onPress={() => router.push("/create")}
		>
			<Feather name="mic" size={24} color={colors.white} />
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	floatingActionButton: {
		position: "absolute",
		right: 16,
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: "center",
		alignItems: "center",
		elevation: 8,
		zIndex: 1000,
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
});

export default ProfileFloatingActionButton;
