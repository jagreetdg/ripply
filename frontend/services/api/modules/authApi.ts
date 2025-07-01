import { apiRequest, ENDPOINTS, setAuthToken, removeAuthToken, getStoredUser, setStoredUser, removeStoredUser } from "../config";

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
    console.log('[PERF] getCurrentUser - Checking AsyncStorage for stored user data');
    const userData = await getStoredUser();
    
    if (userData) {
      console.log('[PERF] getCurrentUser - Found stored user data');
      return userData;
    } else {
      console.log('[PERF] getCurrentUser - No stored user data found');
      return null;
    }
  } catch (error) {
    console.error("Error getting current user from storage:", error);
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

    // Store the token and user data
    if (data.token) {
      await setAuthToken(data.token);
    }
    
    if (data.user) {
      console.log('[PERF] login - Storing user data in AsyncStorage');
      await setStoredUser(data.user);
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

    // Store the token and user data
    if (data.token) {
      await setAuthToken(data.token);
    }
    
    if (data.user) {
      console.log('[PERF] register - Storing user data in AsyncStorage');
      await setStoredUser(data.user);
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
    // Always remove the token and user data locally
    console.log('[PERF] logout - Clearing stored auth data');
    await removeAuthToken();
    await removeStoredUser();
  }
};

// Verify token
export const verifyToken = async (): Promise<AuthResponse> => {
  try {
    const data = await apiRequest<AuthResponse>(ENDPOINTS.VERIFY_TOKEN, {
      requiresAuth: true,
    });
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
      `${ENDPOINTS.CHECK_USERNAME}/${encodeURIComponent(username)}`,
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
      `${ENDPOINTS.CHECK_EMAIL}/${encodeURIComponent(email)}`,
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