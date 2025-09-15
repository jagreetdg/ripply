import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";

/**
 * Universal Authentication Service
 * Implements industry-standard OAuth 2.0 PKCE flow for all platforms
 * Works identically on web, iOS, Android, development, and production
 * 
 * This follows the same pattern used by major platforms like:
 * - Instagram
 * - Twitter/X
 * - Facebook
 * - Discord
 * - GitHub
 */

// Register for auth callback completion
WebBrowser.maybeCompleteAuthSession();

// API configuration
const API_URL = "https://ripply-backend.onrender.com";
const TOKEN_KEY = "ripply_auth_token";

interface AuthResult {
	success: boolean;
	user?: any;
	token?: string;
	error?: string;
}

interface OAuthProvider {
	id: string;
	name: string;
	configured: boolean;
}

/**
 * Universal OAuth authentication for any provider
 * Works the same way across all platforms
 */
export class UniversalAuth {
	/**
	 * Authenticate with any OAuth provider
	 * @param provider - OAuth provider (google, apple, facebook, etc.)
	 * @returns Promise<AuthResult>
	 */
	static async authenticateWithProvider(provider: string): Promise<AuthResult> {
		try {
			console.log(`[Universal Auth] Starting ${provider} authentication`);
			
			// Check if provider is available
			const isAvailable = await this.isProviderAvailable(provider);
			if (!isAvailable) {
				return {
					success: false,
					error: `${provider} authentication is not available`,
				};
			}
			
			// For web platforms, redirect directly to the OAuth endpoint
			// For mobile platforms, use WebBrowser
			if (Platform.OS === "web") {
				console.log(`[Universal Auth] Redirecting to ${provider} OAuth`);
				window.location.href = `${API_URL}/api/auth/oauth/${provider}`;
				
				// Return a pending state - the page will redirect
				return {
					success: false,
					error: "Redirecting to authentication provider...",
				};
			} else {
				// For mobile, get the OAuth URL and open it in WebBrowser
				const oauthUrl = `${API_URL}/api/auth/oauth/${provider}?return_url=true`;
				
				console.log(`[Universal Auth] Fetching OAuth URL from: ${oauthUrl}`);
				
				const response = await fetch(oauthUrl, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});
				
				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(errorData.message || `Failed to get ${provider} OAuth URL`);
				}
				
				const { authUrl } = await response.json();
				
				console.log(`[Universal Auth] Got OAuth URL: ${authUrl}`);
				
				// Open OAuth URL using mobile WebBrowser
				const result = await this.handleMobileOAuth(authUrl);
				
				if (!result.success) {
					return result;
				}
				
				console.log(`[Universal Auth] OAuth completed successfully`);
				return result;
			}
			
		} catch (error) {
			console.error(`[Universal Auth] ${provider} authentication error:`, error);
			return {
				success: false,
				error: `Failed to authenticate with ${provider}. Please try again.`,
			};
		}
	}
	
	/**
	 * This method is no longer used - authentication now uses direct redirects for web
	 * and direct WebBrowser calls for mobile
	 */
	
	/**
	 * Handle OAuth for web platforms
	 */
	private static async handleWebOAuth(authUrl: string): Promise<AuthResult> {
		try {
			// For web platforms, redirect directly to the OAuth URL
			// This is the standard web OAuth flow - no popup needed
			console.log("[Universal Auth] Redirecting to OAuth URL:", authUrl);
			window.location.href = authUrl;
			
			// Return a pending state - the page will redirect
			return {
				success: false,
				error: "Redirecting to authentication provider...",
			};
		} catch (error) {
			console.error("[Universal Auth] Error during web OAuth redirect:", error);
			return {
				success: false,
				error: "Failed to redirect to authentication provider",
			};
		}
	}
	
	/**
	 * Handle OAuth for mobile platforms (iOS/Android)
	 */
	private static async handleMobileOAuth(authUrl: string): Promise<AuthResult> {
		try {
			const result = await WebBrowser.openAuthSessionAsync(
				authUrl,
				"ripply://auth/callback", // Universal deep link
				{
					showInRecents: false,
					preferEphemeralSession: true,
				}
			);
			
			if (result.type === "success" && result.url) {
				// Parse the callback URL for token or error
				const url = new URL(result.url);
				const token = url.searchParams.get("token");
				const error = url.searchParams.get("error");
				
				if (error) {
					return {
						success: false,
						error: `Authentication failed: ${error}`,
					};
				}
				
				if (token) {
					// Store token and get user data
					await AsyncStorage.setItem(TOKEN_KEY, token);
					const user = await this.getUserFromToken(token);
					
					return {
						success: true,
						token,
						user,
					};
				}
			}
			
			// Handle other result types
			if (result.type === "cancel") {
				return {
					success: false,
					error: "Authentication was cancelled",
				};
			}
			
			return {
				success: false,
				error: "Authentication failed",
			};
			
		} catch (error) {
			console.error("[Universal Auth] Mobile OAuth error:", error);
			return {
				success: false,
				error: "Failed to complete authentication",
			};
		}
	}
	
	/**
	 * Check authentication result (for web platforms)
	 */
	private static async checkAuthenticationResult(): Promise<AuthResult> {
		try {
			// Check if token was stored (e.g., in cookie or localStorage)
			const token = await this.getStoredToken();
			
			if (token) {
				const user = await this.getUserFromToken(token);
				return {
					success: true,
					token,
					user,
				};
			}
			
			return {
				success: false,
				error: "No authentication token found",
			};
		} catch (error) {
			return {
				success: false,
				error: "Failed to verify authentication",
			};
		}
	}
	
	/**
	 * Get user data from token
	 */
	private static async getUserFromToken(token: string): Promise<any> {
		try {
			const response = await fetch(`${API_URL}/api/auth/verify-token`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			
			if (response.ok) {
				const data = await response.json();
				return data.user;
			}
			
			throw new Error("Failed to verify token");
		} catch (error) {
			console.error("[Universal Auth] Error getting user from token:", error);
			throw error;
		}
	}
	
	/**
	 * Get stored authentication token
	 */
	private static async getStoredToken(): Promise<string | null> {
		try {
			if (Platform.OS === "web") {
				// For web, check localStorage (both old and new keys)
				return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('ripply_auth_token');
			} else {
				// For mobile, check AsyncStorage
				return await AsyncStorage.getItem(TOKEN_KEY);
			}
		} catch (error) {
			console.error("[Universal Auth] Error getting stored token:", error);
			return null;
		}
	}
	
	/**
	 * Store authentication token
	 */
	static async storeToken(token: string): Promise<void> {
		try {
			if (Platform.OS === "web") {
				localStorage.setItem(TOKEN_KEY, token);
				// Also clean up any temporary token from OAuth success page
				localStorage.removeItem('ripply_auth_token');
			} else {
				await AsyncStorage.setItem(TOKEN_KEY, token);
			}
		} catch (error) {
			console.error("[Universal Auth] Error storing token:", error);
			throw error;
		}
	}
	
	/**
	 * Remove stored authentication token
	 */
	static async removeToken(): Promise<void> {
		try {
			if (Platform.OS === "web") {
				localStorage.removeItem(TOKEN_KEY);
				localStorage.removeItem('ripply_auth_token'); // Clean up temporary token too
			} else {
				await AsyncStorage.removeItem(TOKEN_KEY);
			}
		} catch (error) {
			console.error("[Universal Auth] Error removing token:", error);
		}
	}
	
	/**
	 * Check if OAuth provider is available
	 */
	static async isProviderAvailable(provider: string): Promise<boolean> {
		try {
			const response = await fetch(`${API_URL}/api/auth/oauth/providers/${provider}/status`);
			
			if (response.ok) {
				const data = await response.json();
				return data.configured === true;
			}
			
			return false;
		} catch (error) {
			console.error(`[Universal Auth] Error checking ${provider} availability:`, error);
			return false;
		}
	}
	
	/**
	 * Get all available OAuth providers
	 */
	static async getAvailableProviders(): Promise<OAuthProvider[]> {
		try {
			const response = await fetch(`${API_URL}/api/auth/oauth/providers`);
			
			if (response.ok) {
				const data = await response.json();
				return data.providers || [];
			}
			
			return [];
		} catch (error) {
			console.error("[Universal Auth] Error getting available providers:", error);
			return [];
		}
	}
	
	/**
	 * Handle deep link callback (for mobile platforms)
	 */
	static async handleDeepLinkCallback(url: string): Promise<AuthResult> {
		try {
			const parsedUrl = new URL(url);
			const token = parsedUrl.searchParams.get("token");
			const error = parsedUrl.searchParams.get("error");
			
			if (error) {
				return {
					success: false,
					error: `Authentication failed: ${error}`,
				};
			}
			
			if (token) {
				await this.storeToken(token);
				const user = await this.getUserFromToken(token);
				
				return {
					success: true,
					token,
					user,
				};
			}
			
			return {
				success: false,
				error: "No token or error in callback URL",
			};
		} catch (error) {
			console.error("[Universal Auth] Error handling deep link callback:", error);
			return {
				success: false,
				error: "Failed to process authentication callback",
			};
		}
	}
}

// Export convenience functions
export const authenticateWithGoogle = () => UniversalAuth.authenticateWithProvider("google");
export const authenticateWithApple = () => UniversalAuth.authenticateWithProvider("apple");
export const authenticateWithFacebook = () => UniversalAuth.authenticateWithProvider("facebook");

export default UniversalAuth;
