import React, {
	useEffect,
	useRef,
	createContext,
	useContext,
	useState,
} from "react";
import {
	View,
	Text,
	StyleSheet,
	Animated,
	Platform,
	ToastAndroid,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface ToastProps {
	message: string;
	type?: "success" | "error" | "info";
	visible: boolean;
	onHide: () => void;
	duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
	message,
	type = "info",
	visible,
	onHide,
	duration = 3000,
}) => {
	const { colors } = useTheme();
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(50)).current;

	console.log("[TOAST COMPONENT] Rendered with:", {
		message,
		type,
		visible,
		duration,
	});

	useEffect(() => {
		console.log("[TOAST COMPONENT] useEffect triggered, visible:", visible);
		if (visible) {
			// For Android, use native toast
			if (Platform.OS === "android") {
				console.log("[TOAST COMPONENT] Using Android native toast");
				ToastAndroid.show(message, ToastAndroid.SHORT);
				onHide();
				return;
			}

			console.log("[TOAST COMPONENT] Using custom animated toast for iOS/web");
			// For iOS and web, use custom animated toast
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(translateY, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start(() => {
				console.log("[TOAST COMPONENT] ✅ Show animation completed");
			});

			// Auto hide after duration
			const timer = setTimeout(() => {
				console.log("[TOAST COMPONENT] Auto-hide timer triggered");
				Animated.parallel([
					Animated.timing(fadeAnim, {
						toValue: 0,
						duration: 300,
						useNativeDriver: true,
					}),
					Animated.timing(translateY, {
						toValue: 50,
						duration: 300,
						useNativeDriver: true,
					}),
				]).start(() => {
					console.log("[TOAST COMPONENT] ✅ Hide animation completed");
					onHide();
				});
			}, duration);

			return () => {
				console.log("[TOAST COMPONENT] Cleanup timer");
				clearTimeout(timer);
			};
		}
	}, [visible, message, duration, fadeAnim, translateY, onHide]);

	// Don't render anything on Android (uses native toast)
	if (Platform.OS === "android" || !visible) {
		console.log(
			"[TOAST COMPONENT] Not rendering:",
			Platform.OS === "android" ? "Android platform" : "Not visible"
		);
		return null;
	}

	console.log("[TOAST COMPONENT] Rendering custom toast");

	const getBackgroundColor = () => {
		switch (type) {
			case "success":
				return "#4CAF50";
			case "error":
				return "#F44336";
			default:
				return colors.tint;
		}
	};

	return (
		<Animated.View
			style={[
				styles.container,
				{
					opacity: fadeAnim,
					transform: [{ translateY }],
					backgroundColor: getBackgroundColor(),
				},
			]}
		>
			<Text style={styles.message}>{message}</Text>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		bottom: 100,
		left: 20,
		right: 20,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 8,
		zIndex: 1000,
		elevation: 10,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	message: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "500",
		textAlign: "center",
	},
});

// Global Toast Context
interface GlobalToastContextType {
	showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const GlobalToastContext = createContext<GlobalToastContextType | undefined>(
	undefined
);

export const GlobalToastProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error" | "info";
		visible: boolean;
	}>({
		message: "",
		type: "info",
		visible: false,
	});

	const showToast = (
		message: string,
		type: "success" | "error" | "info" = "info"
	) => {
		console.log("[GLOBAL TOAST] showToast called:", { message, type });
		setToast({ message, type, visible: true });
		console.log("[GLOBAL TOAST] Toast state updated to visible");
	};

	const hideToast = () => {
		console.log("[GLOBAL TOAST] hideToast called");
		setToast((prev) => ({ ...prev, visible: false }));
		console.log("[GLOBAL TOAST] Toast state updated to hidden");
	};

	return (
		<GlobalToastContext.Provider value={{ showToast }}>
			{children}
			<Toast
				message={toast.message}
				type={toast.type}
				visible={toast.visible}
				onHide={hideToast}
			/>
		</GlobalToastContext.Provider>
	);
};

export const useGlobalToast = () => {
	const context = useContext(GlobalToastContext);
	if (context === undefined) {
		throw new Error("useGlobalToast must be used within a GlobalToastProvider");
	}
	return context;
};

// Hook for using toast (keeping for backward compatibility)
export const useToast = () => {
	const [toast, setToast] = React.useState<{
		message: string;
		type: "success" | "error" | "info";
		visible: boolean;
	}>({
		message: "",
		type: "info",
		visible: false,
	});

	const showToast = (
		message: string,
		type: "success" | "error" | "info" = "info"
	) => {
		console.log("[TOAST] showToast called:", { message, type });
		setToast({ message, type, visible: true });
		console.log("[TOAST] Toast state updated to visible");
	};

	const hideToast = () => {
		console.log("[TOAST] hideToast called");
		setToast((prev) => ({ ...prev, visible: false }));
		console.log("[TOAST] Toast state updated to hidden");
	};

	const ToastComponent = () => (
		<Toast
			message={toast.message}
			type={toast.type}
			visible={toast.visible}
			onHide={hideToast}
		/>
	);

	return { showToast, ToastComponent };
};
