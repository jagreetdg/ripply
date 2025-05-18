import React, {
	createContext,
	useState,
	useEffect,
	useContext,
	ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../constants/Colors"; // Assuming your Colors.ts is here

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
	theme: ThemeMode;
	isDarkMode: boolean;
	colors: typeof Colors.light | typeof Colors.dark;
	setTheme: (theme: ThemeMode) => void;
}

const THEME_STORAGE_KEY = "@ripply_theme_preference";

// Define light and dark themes based on your Colors.ts
const lightThemeColors = Colors.light;
const darkThemeColors = Colors.dark;

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const systemColorScheme = useColorScheme(); // "light", "dark", or null
	const [theme, setThemeState] = useState<ThemeMode>("system"); // Default to system

	// Determine if dark mode is active
	const isDarkMode =
		theme === "dark" || (theme === "system" && systemColorScheme === "dark");

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
				} else {
					// If no preference, or invalid, use system and store it
					setThemeState("system");
					await AsyncStorage.setItem(THEME_STORAGE_KEY, "system");
				}
			} catch (error) {
				console.error("Failed to load theme preference:", error);
				setThemeState("system"); // Fallback to system on error
			}
		};
		loadThemePreference();
	}, []);

	// Function to set and store theme preference
	const handleSetTheme = async (newTheme: ThemeMode) => {
		try {
			await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
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
