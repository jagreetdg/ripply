import { apiRequest, ENDPOINTS, setAuthToken, removeAuthToken } from "../config";

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  display_name: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

export interface CheckUsernameResponse {
  available: boolean;
  message: string;
}

export interface CheckEmailResponse {
  available: boolean;
  message: string;
}

// Get current user from storage
export const getCurrentUser = async () => {
  try {
    // This function should get user data from storage or make an API call
    // For now, let's return null to avoid the error and let verifyToken handle auth
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Login user
export const login = async (loginData: LoginRequest): Promise<AuthResponse> => {
  try {
    const data = await apiRequest<AuthResponse>(
      ENDPOINTS.LOGIN,
      {
        method: "POST",
        body: loginData,
        requiresAuth: false,
      }
    );

    // Store the token
    if (data.token) {
      await setAuthToken(data.token);
    }

    return data;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

// Register user
export const register = async (registerData: RegisterRequest): Promise<AuthResponse> => {
  try {
    const data = await apiRequest<AuthResponse>(
      ENDPOINTS.REGISTER,
      {
        method: "POST",
        body: registerData,
        requiresAuth: false,
      }
    );

    // Store the token
    if (data.token) {
      await setAuthToken(data.token);
    }

    return data;
  } catch (error) {
    console.error("Error during registration:", error);
    throw error;
  }
};

// Logout user
export const logout = async (): Promise<void> => {
  try {
    await apiRequest(ENDPOINTS.LOGOUT, {
      method: "POST",
    });
  } catch (error) {
    console.error("Error during logout:", error);
    // Continue with local cleanup even if server logout fails
  } finally {
    // Always remove the token locally
    await removeAuthToken();
  }
};

// Verify token
export const verifyToken = async (): Promise<AuthResponse> => {
  try {
    const data = await apiRequest<AuthResponse>(ENDPOINTS.VERIFY_TOKEN);
    return data;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw error;
  }
};

// Check username availability
export const checkUsername = async (username: string): Promise<CheckUsernameResponse> => {
  try {
    const data = await apiRequest<CheckUsernameResponse>(
      `${ENDPOINTS.CHECK_USERNAME}?username=${encodeURIComponent(username)}`,
      { requiresAuth: false }
    );
    return data;
  } catch (error) {
    console.error("Error checking username:", error);
    throw error;
  }
};

// Check email availability
export const checkEmail = async (email: string): Promise<CheckEmailResponse> => {
  try {
    const data = await apiRequest<CheckEmailResponse>(
      `${ENDPOINTS.CHECK_EMAIL}?email=${encodeURIComponent(email)}`,
      { requiresAuth: false }
    );
    return data;
  } catch (error) {
    console.error("Error checking email:", error);
    throw error;
  }
};

// Backward compatibility aliases
export const loginUser = login;
export const registerUser = register;
export const checkUsernameAvailability = checkUsername;
export const checkEmailAvailability = checkEmail; 