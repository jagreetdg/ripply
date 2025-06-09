import React, { useEffect, useRef } from "react";
import { View, Text, Animated, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
	visible: boolean;
	message: string;
	type: ToastType;
	duration?: number;
	onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({
	visible,
	message,
	type,
	duration = 3000,
	onHide,
}) => {
	const { colors } = useTheme();
	const slideAnim = useRef(new Animated.Value(-100)).current;
	const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (visible) {
			// Clear any existing timeout
			if (hideTimeoutRef.current) {
				clearTimeout(hideTimeoutRef.current);
			}

			// Slide in
			Animated.spring(slideAnim, {
				toValue: 50,
				useNativeDriver: true,
				tension: 100,
				friction: 8,
			}).start();

			// Auto hide after duration
			hideTimeoutRef.current = setTimeout(() => {
				hideToast();
			}, duration);
		}

		return () => {
			if (hideTimeoutRef.current) {
				clearTimeout(hideTimeoutRef.current);
			}
		};
	}, [visible, duration]);

	const hideToast = () => {
		Animated.timing(slideAnim, {
			toValue: -100,
			duration: 300,
			useNativeDriver: true,
		}).start(() => {
			onHide();
		});
	};

	const getToastStyles = () => {
		switch (type) {
			case "success":
				return {
					backgroundColor: "#4CAF50",
					iconName: "check-circle" as const,
				};
			case "error":
				return {
					backgroundColor: "#F44336",
					iconName: "error" as const,
				};
			case "warning":
				return {
					backgroundColor: "#FF9800",
					iconName: "warning" as const,
				};
			case "info":
			default:
				return {
					backgroundColor: "#2196F3",
					iconName: "info" as const,
				};
		}
	};

	const toastStyles = getToastStyles();

	if (!visible) return null;

	return (
		<Animated.View
			style={{
				position: "absolute",
				top: 0,
				left: 20,
				right: 20,
				zIndex: 9999,
				transform: [{ translateY: slideAnim }],
			}}
		>
			<TouchableOpacity
				onPress={hideToast}
				style={{
					backgroundColor: toastStyles.backgroundColor,
					padding: 16,
					borderRadius: 8,
					flexDirection: "row",
					alignItems: "center",
					shadowColor: "#000",
					shadowOffset: {
						width: 0,
						height: 2,
					},
					shadowOpacity: 0.25,
					shadowRadius: 3.84,
					elevation: 5,
				}}
			>
				<MaterialIcons
					name={toastStyles.iconName}
					size={24}
					color="white"
					style={{ marginRight: 12 }}
				/>
				<Text
					style={{
						color: "white",
						fontSize: 16,
						fontWeight: "500",
						flex: 1,
					}}
				>
					{message}
				</Text>
				<TouchableOpacity onPress={hideToast}>
					<MaterialIcons name="close" size={20} color="white" />
				</TouchableOpacity>
			</TouchableOpacity>
		</Animated.View>
	);
};
