import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { registerUser, checkUsernameAvailability, checkEmailAvailability } from '../../services/api/authService';
import { useUser } from '../../context/UserContext';

interface ApiResponse {
  exists?: boolean;
  available?: boolean;
  message?: string;
  user?: any;
  token?: string;
  field?: string;
  [key: string]: any;
}

export default function SignupScreen() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Field-specific errors
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Validation states
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(true);

  // Validate username with debounce
  useEffect(() => {
    // Clear previous errors
    setUsernameError('');
    setIsUsernameValid(true);
    
    if (!username) return;
    
    // Basic validation
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setIsUsernameValid(false);
      return;
    }
    
    // Check if username contains only allowed characters
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      setIsUsernameValid(false);
      return;
    }
    
    // Debounce the API call
    const timer = setTimeout(async () => {
      if (username.length >= 3) {
        setIsCheckingUsername(true);
        try {
          const response = await checkUsernameAvailability(username) as ApiResponse;
          if (response && !response.available) {
            setUsernameError('Username is already taken');
            setIsUsernameValid(false);
          }
        } catch (error: any) {
          console.error('Error checking username:', error);
        } finally {
          setIsCheckingUsername(false);
        }
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [username]);
  
  // Validate email with debounce
  useEffect(() => {
    // Clear previous errors
    setEmailError('');
    setIsEmailValid(true);
    
    if (!email) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      setIsEmailValid(false);
      return;
    }
    
    // Debounce the API call
    const timer = setTimeout(async () => {
      if (emailRegex.test(email)) {
        setIsCheckingEmail(true);
        try {
          const response = await checkEmailAvailability(email) as ApiResponse;
          if (response && !response.available) {
            setEmailError('Email is already registered');
            setIsEmailValid(false);
          }
        } catch (error: any) {
          console.error('Error checking email:', error);
        } finally {
          setIsCheckingEmail(false);
        }
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [email]);
  
  // Validate password
  useEffect(() => {
    // Clear previous errors
    setPasswordError('');
    
    if (!password) return;
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
    }
  }, [password]);
  
  // Validate confirm password
  useEffect(() => {
    // Clear previous errors
    setConfirmPasswordError('');
    
    if (!confirmPassword) return;
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    }
  }, [confirmPassword, password]);

  const handleSignup = async () => {
    // Reset all errors
    setError('');
    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    
    // Comprehensive validation
    let hasError = false;
    
    if (!username) {
      setUsernameError('Username is required');
      hasError = true;
    } else if (!isUsernameValid) {
      hasError = true;
    }
    
    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!isEmailValid) {
      hasError = true;
    }
    
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      hasError = true;
    }
    
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }
    
    if (hasError) return;
    
    setIsLoading(true);

    try {
      // Register the user
      const userData = {
        username,
        email,
        password,
        displayName: displayName || username
      };
      
      const response = await registerUser(userData) as ApiResponse;
      
      if (response && response.user && response.token) {
        // Store user data in local storage or context
        setUser({
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          display_name: response.user.display_name || response.user.username,
          avatar_url: response.user.avatar_url || null,
          bio: response.user.bio || null,
          is_verified: response.user.is_verified || false,
          created_at: response.user.created_at,
          updated_at: response.user.updated_at
        });
        // For now, just redirect to home page
        router.push('/(tabs)/home');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error types
      if (error.message && error.message.includes('Username already exists')) {
        setUsernameError('Username is already taken');
      } else if (error.message && error.message.includes('Email already exists')) {
        setEmailError('Email is already registered');
      } else {
        setError(error.message || 'Something went wrong. Please try again.');
      }
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
          <Text style={styles.title}>Create Account</Text>
        </View>

        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={18} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <View style={[styles.inputWrapper, usernameError ? styles.inputError : null]}>
              <Feather name="user" size={20} color={usernameError ? "#e74c3c" : "#999"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor="#999"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
              {isCheckingUsername && <ActivityIndicator size="small" color="#6B2FBC" style={{ marginRight: 8 }} />}
            </View>
            {usernameError ? <Text style={styles.fieldErrorText}>{usernameError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
              <Feather name="mail" size={20} color={emailError ? "#e74c3c" : "#999"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                textContentType="emailAddress"
              />
              {isCheckingEmail && <ActivityIndicator size="small" color="#6B2FBC" style={{ marginRight: 8 }} />}
            </View>
            {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.inputWrapper, passwordError ? styles.inputError : null]}>
              <Feather name="lock" size={20} color={passwordError ? "#e74c3c" : "#999"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Create a password (min. 8 characters)"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                textContentType="newPassword"
              />
              <Pressable 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
              </Pressable>
            </View>
            {passwordError ? <Text style={styles.fieldErrorText}>{passwordError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={[styles.inputWrapper, confirmPasswordError ? styles.inputError : null]}>
              <Feather name="lock" size={20} color={confirmPasswordError ? "#e74c3c" : "#999"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            {confirmPasswordError ? <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text> : null}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Display Name (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Feather name="user-check" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="How you want to be called"
                placeholderTextColor="#999"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
          </View>

          <Text style={styles.termsText}>
            By signing up, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <Pressable 
            style={[styles.signupButton, 
              (isLoading || isCheckingUsername || isCheckingEmail || !isUsernameValid || !isEmailValid) ? 
              styles.signupButtonDisabled : null
            ]} 
            onPress={handleSignup}
            disabled={isLoading || isCheckingUsername || isCheckingEmail || !isUsernameValid || !isEmailValid}
          >
            {isLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.signupButtonText}>Creating Account...</Text>
              </View>
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
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
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/auth/login" asChild>
          <Pressable>
            <Text style={styles.footerLink}>Log In</Text>
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
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdeaea',
  },
  fieldErrorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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
  termsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  termsLink: {
    color: '#6B2FBC',
    fontWeight: '500',
  },
  signupButton: {
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
  signupButtonDisabled: {
    backgroundColor: '#9D7BC7',
  },
  signupButtonText: {
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
