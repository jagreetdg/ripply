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
	setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// Create the context with a default value
const UserContext = createContext<UserContextType>({
	user: null,
	loading: true,
	error: null,
	logout: async () => {},
	refreshUser: async () => {},
	setUser: () => {},
});

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUserState] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Wrap setUser to add logging
	const setUser: React.Dispatch<React.SetStateAction<User | null>> = (
		newUser
	) => {
		console.log(
			"[DEBUG] UserContext - setUser called:",
			typeof newUser === "function"
				? "function"
				: newUser
				? `user:${newUser.id}`
				: "null"
		);
		setUserState(newUser);
		// When we explicitly set a user, we're no longer loading
		setLoading(false);
	};

	// Function to refresh user data
	const refreshUser = async () => {
		console.log(Date.now(), "[PERF] UserContext - refreshUser started");
		setLoading(true);
		setError(null);
		// console.log("[DEBUG] UserContext - refreshUser started"); // Original log, commented for PERF focus

		// Set a timeout to avoid loading state hanging indefinitely
		const loadingTimeout = setTimeout(() => {
			console.log(
				Date.now(), // Added timestamp
				"[PERF] UserContext - Loading timeout (3s) reached, forcing loading to false"
			);
			setLoading(false);
		}, 3000); // 3 seconds max loading time

		try {
			console.log(Date.now(), "[PERF] UserContext - Calling getCurrentUser()");
			const userData = await getCurrentUser();
			console.log(
				Date.now(),
				"[PERF] UserContext - getCurrentUser() done. User data exists:",
				!!userData
			);

			if (userData) {
				console.log(
					Date.now(),
					"[PERF] UserContext - Setting user from getCurrentUser"
				);
				setUser(userData as User); // setUser also sets loading to false
			} else {
				console.log(
					Date.now(),
					"[PERF] UserContext - No user from getCurrentUser. Calling verifyToken()"
				);
				try {
					const verifiedUser = await verifyToken();
					console.log(
						Date.now(), // Added timestamp
						"[PERF] UserContext - verifyToken() done. Verified user exists:",
						!!verifiedUser
					);
					if (verifiedUser && "user" in verifiedUser) {
						console.log(
							Date.now(),
							"[PERF] UserContext - Setting user from verifyToken"
						);
						setUser(verifiedUser.user as User); // setUser also sets loading to false
					} else {
						console.log(
							Date.now(), // Added timestamp
							"[PERF] UserContext - No user from verifyToken, setting user to null via setUser"
						);
						setUser(null); // setUser also sets loading to false
					}
				} catch (verifyError) {
					console.error(
						Date.now(),
						"[PERF] UserContext - Token verification failed inside refreshUser:",
						verifyError
					);
					console.log(
						Date.now(), // Added timestamp
						"[PERF] UserContext - Token verification failed, setting user to null via setUser"
					);
					setUser(null); // setUser also sets loading to false
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
				Date.now(), // Added timestamp
				"[PERF] UserContext - Error in refreshUser, setting user to null via setUser"
			);
			setUser(null); // setUser also sets loading to false
		} finally {
			clearTimeout(loadingTimeout);
			// setLoading(false); // setUser above should handle this, or it might cause a flicker if called too early
			console.log(
				Date.now(), // Added timestamp
				"[PERF] UserContext - refreshUser completed (finally block). Current loading state:",
				loading
			);
			// If setUser(null) was the last thing called, loading should be false already.
			// If a user was found and set, loading should be false.
			// Explicitly setting it false again IF NOT ALREADY HANDLED might be redundant or cause issues.
			// However, to be absolutely sure the loading flag from this context is cleared, we might need it here.
			// Let's test without it first as setUser now handles it.
			// Re-adding for safety if setUser isn't always hit or if a path exists where loading stays true
			if (loading) {
				// Only set if still true, to prevent unnecessary re-renders
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
			setUser(null);
		} catch (err) {
			console.error("Error logging out:", err);
			setError("Failed to logout");
			// Still clear user state even if logout API fails
			setUser(null);
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
