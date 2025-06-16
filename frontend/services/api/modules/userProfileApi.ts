/**
 * User profile API module for handling basic profile-related API calls
 */
import { ENDPOINTS, apiRequest } from "../config";
import { User, UpdateUserProfileParams, UserPhoto, UpdateUserPhotosParams } from "./types/userTypes";

/**
 * Get a user profile by ID
 * @param userId - User ID
 * @returns User profile data
 */
export const getUserProfile = (userId: string): Promise<User> => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}`, { requiresAuth: false });
};

/**
 * Update a user profile
 * @param userId - User ID
 * @param userData - User data to update
 * @returns Updated user profile
 */
export const updateUserProfile = (
  userId: string, 
  userData: UpdateUserProfileParams
): Promise<User> => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}`, {
    method: "PUT",
    body: userData,
  });
};

/**
 * Get user profile by username
 * @param username - Username
 * @returns User profile data or null if not found
 */
export const getUserProfileByUsername = async (username: string): Promise<User | null> => {
  try {
    // Remove @ symbol if present
    const cleanUsername = username.startsWith("@")
      ? username.substring(1)
      : username;

    const response = await apiRequest<User | { data: User }>(
      `${ENDPOINTS.USERS}/username/${cleanUsername}`,
      { requiresAuth: false }
    );

    // The response might be the data directly or have a data property
    if (response && typeof response === "object") {
      if ("data" in response) {
        return response.data;
      } else {
        // The response itself is the user data
        return response;
      }
    }
    return null;
  } catch (error) {
    if ((error as Error).name === "UserNotFoundError") {
      return null;
    }
    throw error;
  }
};

/**
 * Update user verification status
 * @param userId - User ID
 * @param isVerified - Verification status
 * @returns Updated user data
 */
export const updateUserVerificationStatus = async (
  userId: string, 
  isVerified: boolean
): Promise<User> => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}/verify`, {
    method: "PATCH",
    body: { is_verified: isVerified },
  });
};

/**
 * Update user profile photos
 * @param userId - User ID
 * @param photos - Array of photo objects
 * @returns Updated user data
 */
export const updateUserPhotos = async (
  userId: string, 
  photos: UserPhoto[]
): Promise<User> => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}/photos`, {
    method: "PATCH",
    body: { photos },
  });
}; 