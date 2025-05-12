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
	logoutUser,
} from "../services/api/authService";

// Define the User interface
export interface User {
	id: string;
	username: string;
	display_name: string;
	email: string;
	avatar_url: string | null;
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
	const setUser = (newUser: User | null) => {
		console.log(
			"[DEBUG] UserContext - setUser called:",
			newUser ? `user:${newUser.id}` : "null"
		);
		setUserState(newUser);
	};

	// Function to refresh user data
	const refreshUser = async () => {
		setLoading(true);
		setError(null);
		console.log("[DEBUG] UserContext - refreshUser started");
		try {
			// First try to get user from local storage
			const userData = await getCurrentUser();
			console.log("[DEBUG] UserContext - getCurrentUser result:", !!userData);
			if (userData) {
				console.log("[DEBUG] UserContext - Setting user from getCurrentUser");
				setUser(userData as User);
			} else {
				// If not in local storage, try to verify token
				try {
					console.log("[DEBUG] UserContext - Trying to verify token");
					const verifiedUser = await verifyToken();
					console.log(
						"[DEBUG] UserContext - verifyToken result:",
						!!verifiedUser
					);
					// Fix TypeScript error by properly typing the response
					if (verifiedUser && "user" in verifiedUser) {
						console.log("[DEBUG] UserContext - Setting user from verifyToken");
						setUser(verifiedUser.user as User);
					} else {
						console.log(
							"[DEBUG] UserContext - No user from verifyToken, setting null"
						);
						setUser(null);
					}
				} catch (verifyError) {
					console.error("Token verification failed:", verifyError);
					console.log(
						"[DEBUG] UserContext - Token verification failed, setting user to null"
					);
					setUser(null);
				}
			}
		} catch (err) {
			console.error("Error refreshing user:", err);
			setError("Failed to load user data");
			console.log(
				"[DEBUG] UserContext - Error in refreshUser, setting user to null"
			);
			setUser(null);
		} finally {
			setLoading(false);
			console.log(
				"[DEBUG] UserContext - refreshUser completed, loading set to false"
			);
		}
	};

	// Function to handle logout
	const logout = async () => {
		setLoading(true);
		try {
			await logoutUser();
			setUser(null);
		} catch (err) {
			console.error("Error logging out:", err);
			setError("Failed to logout");
		} finally {
			setLoading(false);
		}
	};

	// Load user data on initial mount
	useEffect(() => {
		refreshUser();
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
