import React, {
	createContext,
	useState,
	useEffect,
	useContext,
	ReactNode,
	useRef,
} from "react";
import { useColorScheme, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../constants/Colors"; // Assuming your Colors.ts is here

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
	theme: ThemeMode;
	isDarkMode: boolean;
	colors: typeof Colors.light | typeof Colors.dark;
	setTheme: (theme: ThemeMode) => void;
	animation: Animated.Value;
}

const THEME_STORAGE_KEY = "@ripply_theme_preference";
const TRANSITION_DURATION = 250; // ms

// Define light and dark themes based on your Colors.ts
const lightThemeColors = Colors.light;
const darkThemeColors = Colors.dark;

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const systemColorScheme = useColorScheme(); // "light", "dark", or null
	const [theme, setThemeState] = useState<ThemeMode>("system"); // Default to system
	const [isAnimating, setIsAnimating] = useState(false);

	// Animation value for theme transitions: 0 = light, 1 = dark
	const animation = useRef(new Animated.Value(0)).current;

	// Determine if dark mode is active
	const isDarkMode =
		theme === "dark" || (theme === "system" && systemColorScheme === "dark");

	// Set initial animation value based on theme
	useEffect(() => {
		animation.setValue(isDarkMode ? 1 : 0);
	}, []);

	// Get the appropriate color set
	const currentColors = isDarkMode ? darkThemeColors : lightThemeColors;

	// Load stored theme preference on mount
	useEffect(() => {
		const loadThemePreference = async () => {
			try {
				const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
				if (
					storedTheme &&
					(storedTheme === "light" ||
						storedTheme === "dark" ||
						storedTheme === "system")
				) {
					setThemeState(storedTheme as ThemeMode);

					// Set animation value without animation on initial load
					const isStoredDark =
						storedTheme === "dark" ||
						(storedTheme === "system" && systemColorScheme === "dark");
					animation.setValue(isStoredDark ? 1 : 0);
				} else {
					// If no preference, or invalid, use system and store it
					setThemeState("system");
					await AsyncStorage.setItem(THEME_STORAGE_KEY, "system");

					// Set animation value based on system preference
					animation.setValue(systemColorScheme === "dark" ? 1 : 0);
				}
			} catch (error) {
				console.error("Failed to load theme preference:", error);
				setThemeState("system"); // Fallback to system on error
				animation.setValue(systemColorScheme === "dark" ? 1 : 0);
			}
		};
		loadThemePreference();
	}, []);

	// Function to set and store theme preference
	const handleSetTheme = async (newTheme: ThemeMode) => {
		try {
			await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);

			// Determine if the new theme is dark
			const willBeDark =
				newTheme === "dark" ||
				(newTheme === "system" && systemColorScheme === "dark");

			// Only animate if the appearance is changing
			if ((isDarkMode && !willBeDark) || (!isDarkMode && willBeDark)) {
				setIsAnimating(true);

				// Animate theme transition
				Animated.timing(animation, {
					toValue: willBeDark ? 1 : 0,
					duration: TRANSITION_DURATION,
					useNativeDriver: false, // We're animating non-transform/opacity
				}).start(() => {
					setIsAnimating(false);
				});
			}

			setThemeState(newTheme);
		} catch (error) {
			console.error("Failed to save theme preference:", error);
		}
	};

	return (
		<ThemeContext.Provider
			value={{
				theme,
				isDarkMode,
				colors: currentColors,
				setTheme: handleSetTheme,
				animation,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};

/**
 * Hook for animating colors during theme transitions
 * @param lightValue - Color value for light theme
 * @param darkValue - Color value for dark theme
 * @returns Animated interpolation of the color
 */
export const useAnimatedColor = (lightValue: string, darkValue: string) => {
	const { animation } = useTheme();

	return animation.interpolate({
		inputRange: [0, 1],
		outputRange: [lightValue, darkValue],
	});
};
