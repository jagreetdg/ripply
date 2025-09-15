import React, {
	createContext,
	useState,
	useEffect,
	useContext,
	ReactNode,
} from "react";
import {
	getCurrentUser,
	verifyToken,
	logout as apiLogout,
} from "../services/api";
import { setStoredUser, removeStoredUser } from "../services/api/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UniversalAuth } from "../services/api/universalAuth";

// Define the User interface
export interface User {
	id: string;
	username: string;
	display_name: string;
	email: string;
	avatar_url: string | null;
	cover_photo_url?: string | null;
	bio?: string | null;
	is_verified?: boolean;
	created_at?: string;
	updated_at?: string;
}

// Define the context interface
interface UserContextType {
	user: User | null;
	loading: boolean;
	error: string | null;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
	setUser: (user: React.SetStateAction<User | null>) => Promise<void>;
}

// Create the context with a default value
const UserContext = createContext<UserContextType>({
	user: null,
	loading: true,
	error: null,
	logout: async () => {},
	refreshUser: async () => {},
	setUser: async () => {},
});

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUserState] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Wrap setUser to add logging and persistence
	const setUser: (
		user: React.SetStateAction<User | null>
	) => Promise<void> = async (newUser) => {
		console.log(
			"[DEBUG] UserContext - setUser called:",
			typeof newUser === "function"
				? "function"
				: newUser
				? `user:${newUser.id}`
				: "null"
		);

		// Handle function updates
		if (typeof newUser === "function") {
			setUserState((prevUser) => {
				const updatedUser = newUser(prevUser);
				// Store the updated user data
				if (updatedUser) {
					setStoredUser(updatedUser).catch(console.error);
				} else {
					removeStoredUser().catch(console.error);
				}
				return updatedUser;
			});
		} else {
			setUserState(newUser);
			// Store user data in AsyncStorage for persistence
			if (newUser) {
				console.log("[DEBUG] UserContext - Storing user data for persistence");
				await setStoredUser(newUser).catch(console.error);
			} else {
				console.log("[DEBUG] UserContext - Removing stored user data");
				await removeStoredUser().catch(console.error);
			}
		}

		// When we explicitly set a user, we're no longer loading
		setLoading(false);
	};

	// Function to refresh user data
	const refreshUser = async () => {
		console.log(Date.now(), "[PERF] UserContext - refreshUser started");
		setLoading(true);
		setError(null);

		// Set a timeout to avoid loading state hanging indefinitely
		const loadingTimeout = setTimeout(() => {
			console.log(
				Date.now(),
				"[PERF] UserContext - Loading timeout (3s) reached, forcing loading to false"
			);
			setLoading(false);
		}, 3000); // 3 seconds max loading time

		try {
			// First check if we have a token stored using UniversalAuth
			const token = await UniversalAuth.getStoredToken();
			console.log(
				Date.now(),
				"[PERF] UserContext - Token found:",
				token ? "YES" : "NO"
			);

			if (!token) {
				console.log(
					Date.now(),
					"[PERF] UserContext - No auth token found, setting user to null"
				);
				clearTimeout(loadingTimeout);
				await setUser(null);
				return;
			}

			console.log(
				Date.now(),
				"[PERF] UserContext - Auth token found, verifying with server"
			);

			// If we have a token, verify it with the server first
			try {
				const verifiedUser = await verifyToken();
				console.log(
					Date.now(),
					"[PERF] UserContext - verifyToken() done. Verified user exists:",
					!!verifiedUser
				);

				if (verifiedUser && "user" in verifiedUser) {
					console.log(
						Date.now(),
						"[PERF] UserContext - Setting user from verifyToken"
					);
					await setUser(verifiedUser.user as User);
				} else {
					console.log(
						Date.now(),
						"[PERF] UserContext - No user from verifyToken, setting user to null"
					);
					await setUser(null);
				}
			} catch (verifyError) {
				console.error(
					Date.now(),
					"[PERF] UserContext - Token verification failed:",
					verifyError
				);

				// If token verification fails, try to use cached data as fallback
				console.log(
					Date.now(),
					"[PERF] UserContext - Trying cached user data as fallback"
				);
				const userData = await getCurrentUser();

				if (userData) {
					console.log(
						Date.now(),
						"[PERF] UserContext - Using cached user data (token may be expired)"
					);
					await setUser(userData as User);
				} else {
					console.log(
						Date.now(),
						"[PERF] UserContext - No cached user data, setting user to null"
					);
					await setUser(null);
				}
			}
		} catch (err) {
			console.error(
				Date.now(),
				"[PERF] UserContext - Error in refreshUser catch block:",
				err
			);
			setError("Failed to load user data");
			console.log(
				Date.now(),
				"[PERF] UserContext - Error in refreshUser, setting user to null"
			);
			await setUser(null);
		} finally {
			clearTimeout(loadingTimeout);
			console.log(
				Date.now(),
				"[PERF] UserContext - refreshUser completed (finally block). Current loading state:",
				loading
			);

			if (loading) {
				setLoading(false);
				console.log(
					Date.now(),
					"[PERF] UserContext - Explicitly set loading to false in finally."
				);
			}
		}
	};

	// Function to handle logout
	const logout = async () => {
		setLoading(true);
		try {
			await apiLogout();
			await setUser(null);
		} catch (err) {
			console.error("Error logging out:", err);
			setError("Failed to logout");
			// Still clear user state even if logout API fails
			await setUser(null);
		} finally {
			setLoading(false);
		}
	};

	// Load user data on initial mount
	useEffect(() => {
		console.log(
			Date.now(),
			"[PERF] UserContext - Initial useEffect, calling refreshUser."
		); // Added timestamp
		refreshUser();

		// Set a fallback timeout to ensure loading state doesn't get stuck
		const fallbackTimeoutId = setTimeout(() => {
			// Use functional update to get the current state of 'loading'
			setLoading((currentLoadingState) => {
				if (currentLoadingState) {
					// Check the *actual current* loading state
					console.log(
						Date.now(), // Added timestamp
						"[PERF] UserContext - Fallback timeout (5s) reached, forcing loading to false because currentLoadingState was true."
					);
					return false; // Set loading to false
				}
				// If currentLoadingState was already false, no need to change it or log.
				return currentLoadingState; // Keep it as is (false)
			});
		}, 5000); // 5 seconds max loading time for initial load

		return () => clearTimeout(fallbackTimeoutId);
	}, []);

	return (
		<UserContext.Provider
			value={{
				user,
				loading,
				error,
				logout,
				refreshUser,
				setUser,
			}}
		>
			{children}
		</UserContext.Provider>
	);
};
