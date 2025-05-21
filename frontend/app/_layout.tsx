import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Slot, SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { UserProvider } from "../context/UserContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import RequireAuth from "../components/auth/RequireAuth";
import { View } from "react-native";

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
				console.warn("Error in prepare:", e);
			}
		}

		prepare();

		// Add a safety timeout to hide splash screen even if fonts aren't loaded
		const timeoutId = setTimeout(() => {
			if (!appIsReady) {
				console.log("Timeout reached, hiding splash screen anyway");
				SplashScreen.hideAsync().catch((e) =>
					console.warn("Error hiding splash:", e)
				);
				setAppIsReady(true);
			}
		}, 3000); // 3 seconds max wait time

		return () => clearTimeout(timeoutId);
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
		<ThemeProvider>
			<ThemedRoot>
				<UserProvider>
					<RequireAuth>
						<Slot />
					</RequireAuth>
				</UserProvider>
			</ThemedRoot>
		</ThemeProvider>
	);
}

function ThemedRoot({ children }: { children: React.ReactNode }) {
	const { colors } = useTheme();
	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			{children}
		</View>
	);
}
