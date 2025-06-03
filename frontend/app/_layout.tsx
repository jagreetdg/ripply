import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Slot, SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { UserProvider } from "../context/UserContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import RequireAuth from "../components/auth/RequireAuth";
import { View } from "react-native";
import TabLayout from "./(tabs)/_layout";
import { GlobalToastProvider } from "../components/common/Toast";

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
		console.log(
			Date.now(),
			`[PERF] _layout.tsx - useEffect for fonts. fontsLoaded: ${fontsLoaded}, fontError: ${fontError}`
		);
		if (fontError) {
			console.error("Font loading error:", fontError);
		}
		async function prepare() {
			try {
				// Keep the splash screen visible while we fetch resources
				if (fontsLoaded) {
					console.log(
						Date.now(),
						"[PERF] _layout.tsx - Fonts are loaded, hiding splash screen."
					);
					// Hide the splash screen
					await SplashScreen.hideAsync();
					// Mark the app as ready
					setAppIsReady(true);
					console.log(Date.now(), "[PERF] _layout.tsx - App is ready.");
				}
			} catch (e) {
				console.warn("Error in prepare:", e);
			}
		}

		prepare();

		// Add a safety timeout to hide splash screen even if fonts aren't loaded
		const timeoutId = setTimeout(() => {
			// Use functional update to get the current state of 'appIsReady'
			setAppIsReady((currentAppIsReady) => {
				if (!currentAppIsReady) {
					console.log(
						Date.now(),
						"[PERF] _layout.tsx - Safety timeout (3s) reached, hiding splash screen because app was not ready."
					);
					SplashScreen.hideAsync().catch((e) =>
						console.warn("Error hiding splash from timeout:", e)
					);
					return true; // Mark app as ready
				}
				return currentAppIsReady; // App was already ready, no change needed
			});
		}, 3000); // 3 seconds max wait time

		return () => clearTimeout(timeoutId);
	}, [fontsLoaded, fontError]);

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
				<GlobalToastProvider>
					<UserProvider>
						<RequireAuth>
							<Slot />
						</RequireAuth>
					</UserProvider>
				</GlobalToastProvider>
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
