import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";

interface ProfileFloatingActionButtonProps {
	userId?: string;
	isOwnProfile?: boolean;
	onPress?: () => void;
}

const ProfileFloatingActionButton: React.FC<
	ProfileFloatingActionButtonProps
> = ({ onPress }) => {
	const { colors } = useTheme();
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
			onPress={onPress}
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
