import React from "react";
import {
	TouchableOpacity,
	View,
	StyleSheet,
	Animated,
	Platform,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface CustomToggleProps {
	value: boolean;
	onValueChange: (value: boolean) => void;
	disabled?: boolean;
}

export const CustomToggle: React.FC<CustomToggleProps> = ({
	value,
	onValueChange,
	disabled = false,
}) => {
	const { colors } = useTheme();
	const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current;

	React.useEffect(() => {
		Animated.timing(animatedValue, {
			toValue: value ? 1 : 0,
			duration: 200,
			useNativeDriver: false,
		}).start();
	}, [value, animatedValue]);

	const handlePress = () => {
		if (!disabled) {
			onValueChange(!value);
		}
	};

	const trackColor = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: [colors.border, colors.tint],
	});

	const thumbPosition = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: [2, 22], // 2px from left when off, 22px when on (accounting for track width)
	});

	const thumbScale = animatedValue.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: [1, 1.1, 1],
	});

	return (
		<TouchableOpacity
			style={[styles.container, disabled && styles.disabled]}
			onPress={handlePress}
			activeOpacity={0.8}
			disabled={disabled}
		>
			<Animated.View
				style={[
					styles.track,
					{
						backgroundColor: trackColor,
						opacity: disabled ? 0.5 : 1,
					},
				]}
			>
				<Animated.View
					style={[
						styles.thumb,
						{
							backgroundColor: colors.card,
							transform: [{ translateX: thumbPosition }, { scale: thumbScale }],
							shadowColor: colors.shadow,
						},
					]}
				/>
			</Animated.View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		justifyContent: "center",
		alignItems: "center",
	},
	track: {
		width: 44,
		height: 24,
		borderRadius: 12,
		justifyContent: "center",
		position: "relative",
	},
	thumb: {
		width: 20,
		height: 20,
		borderRadius: 10,
		position: "absolute",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3,
		elevation: 3,
	},
	disabled: {
		opacity: 0.6,
	},
});
