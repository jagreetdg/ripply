import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Slot, Stack, SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	// Use state to track font loading instead of directly using the hook result
	const [appIsReady, setAppIsReady] = useState(false);
	
	// Load fonts
	const [fontsLoaded, fontError] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
		...FontAwesome.font,
	});

	// Set up the app once fonts are loaded
	useEffect(() => {
		async function prepare() {
			try {
				// Keep the splash screen visible while we fetch resources
				if (fontsLoaded) {
					// Hide the splash screen
					await SplashScreen.hideAsync();
					// Mark the app as ready
					setAppIsReady(true);
				}
			} catch (e) {
				console.warn('Error in prepare:', e);
			}
		}

		prepare();
	}, [fontsLoaded]);

	// If the app isn't ready, show nothing (splash screen will be visible)
	if (!appIsReady) {
		return null;
	}

	// Once ready, render the app
	return <RootLayoutNav />;
}

function RootLayoutNav() {
	// Get the color scheme (light/dark mode)
	const colorScheme = useColorScheme();
	// Default to light theme if colorScheme is null or undefined
	const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

	return (
		<ThemeProvider value={theme}>
			{/* Use Slot instead of Stack for better performance with less nesting */}
			<Slot />
		</ThemeProvider>
	);
}
