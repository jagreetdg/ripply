import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { loginUser, getCurrentUser } from '../../services/api/authService';
import { useUser } from '../../context/UserContext';

// Define the type for the login response
interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    [key: string]: any; // For any other properties the user object might have
  };
  token: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          console.log('User already logged in:', user);
          // User is already logged in, redirect to home
          router.replace('/(tabs)/home');
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        // Don't redirect on error
      }
    };
    
    checkAuthStatus();
  }, []);

  const handleLogin = async () => {
    // Validate inputs
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      console.log('Login button pressed, attempting to login with:', { email });
      
      // Call the login API
      const response = await loginUser({ email, password }) as LoginResponse;
      console.log('Login response in component:', response ? 'Received' : 'Empty');
      
      // Check if login was successful by verifying we have both user and token
      if (response && response.user && response.token) {
        console.log('Login successful:', response.user);
        
        // Update the user context with proper type casting to match User interface
        setUser({
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          display_name: response.user.display_name || response.user.username,
          avatar_url: response.user.avatar_url || null,
          // Include other fields as needed
          bio: response.user.bio || null,
          is_verified: response.user.is_verified || false,
          created_at: response.user.created_at,
          updated_at: response.user.updated_at
        });
        
        // Redirect to home page
        router.replace('/(tabs)/home');
      } else {
        // This handles the case where the API returns a success but without proper data
        console.warn('Login response missing user or token');
        setError('Authentication failed. Please check your credentials.');
        setIsLoading(false); // Make sure to set loading to false
        return; // Don't proceed further
      }
    } catch (err) {
      console.error('Login error:', err);
      // Display user-friendly error message
      const error = err as Error; // Type assertion to Error type
      
      if (error.message && error.message.includes('401')) {
        setError('Invalid email or password. Please try again.');
      } else if (error.message && error.message.includes('404')) {
        setError('User not found. Please check your email.');
      } else if (error.message && error.message.includes('CORS')) {
        setError('Network error. Please try again later.');
      } else if (error.message && error.message.includes('fetch')) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else {
        setError('Login failed. Please try again later.');
      }
      setIsLoading(false);
      return; // Make sure to return and not continue execution
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#333" />
          </Pressable>
          <Text style={styles.title}>Log In</Text>
        </View>

        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={18} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <Feather 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#999" 
                />
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </Pressable>

          <Pressable 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialAuthContainer}>
            <Pressable style={[styles.socialButton, styles.googleButton]}>
              <Feather name="chrome" size={20} color="#EA4335" />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </Pressable>
            
            <Pressable style={[styles.socialButton, styles.appleButton]}>
              <Feather name="smartphone" size={20} color="#000" />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link href="/auth/signup" asChild>
          <Pressable>
            <Text style={styles.footerLink}>Sign Up</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdeaea',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorText: {
    color: '#e74c3c',
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9F9',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#6B2FBC',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#6B2FBC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6B2FBC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#9D7BC7',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E1E1',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  socialAuthContainer: {
    gap: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  googleButton: {
    borderColor: '#DADCE0',
    backgroundColor: '#fff',
  },
  appleButton: {
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B2FBC',
  },
});
