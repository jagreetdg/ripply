import React, {
	useEffect,
	useRef,
	createContext,
	useContext,
	useState,
	useCallback,
} from "react";
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

interface ToastContextType {
	showToast: (message: string, type: ToastType, duration?: number) => void;
	hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a GlobalToastProvider");
	}
	return context;
};

// Alias for backward compatibility
export const useGlobalToast = useToast;

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

	const hideToast = useCallback(() => {
		Animated.timing(slideAnim, {
			toValue: -100,
			duration: 300,
			useNativeDriver: true,
		}).start(() => {
			onHide();
		});
	}, [slideAnim, onHide]);

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
	}, [visible, duration, hideToast]);

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
				left: 0,
				right: 0,
				zIndex: 2147483647,
				transform: [{ translateY: slideAnim }],
				alignItems: "center", // Center the toast horizontally
				paddingHorizontal: 20, // Add horizontal padding to prevent edge touching
			}}
		>
			<View
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
					maxWidth: "90%", // Limit maximum width to 90% of screen
					minWidth: 250, // Set minimum width for very short messages
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
						flexShrink: 1, // Allow text to shrink if needed
						marginRight: 8, // Add some space before the close button
					}}
				>
					{message}
				</Text>
				<TouchableOpacity onPress={hideToast}>
					<MaterialIcons name="close" size={20} color="white" />
				</TouchableOpacity>
			</View>
		</Animated.View>
	);
};

interface ToastState {
	visible: boolean;
	message: string;
	type: ToastType;
	duration?: number;
}

export const GlobalToastProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [toastState, setToastState] = useState<ToastState>({
		visible: false,
		message: "",
		type: "info",
		duration: 3000,
	});

	const showToast = (
		message: string,
		type: ToastType,
		duration: number = 3000
	) => {
		setToastState({
			visible: true,
			message,
			type,
			duration,
		});
	};

	const hideToast = () => {
		setToastState((prev) => ({
			...prev,
			visible: false,
		}));
	};

	return (
		<ToastContext.Provider value={{ showToast, hideToast }}>
			{children}
			<Toast
				visible={toastState.visible}
				message={toastState.message}
				type={toastState.type}
				duration={toastState.duration}
				onHide={hideToast}
			/>
		</ToastContext.Provider>
	);
};
