import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Slot, SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import "react-native-reanimated";

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: "index",
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
	return (
		<ThemeProvider value={DefaultTheme}>
			{/* Use Slot for better performance with less nesting */}
			<Slot />
		</ThemeProvider>
	);
}
