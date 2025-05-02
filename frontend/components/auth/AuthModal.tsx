import React, { useState } from 'react';
import { StyleSheet, View, Modal, Pressable, Text, TextInput, Dimensions, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type AuthModalProps = {
  isVisible: boolean;
  onClose: () => void;
  type: 'login' | 'signup';
  onSwitchToLogin?: () => void;
  onSwitchToSignup?: () => void;
};

export default function AuthModal({ isVisible, onClose, type, onSwitchToLogin, onSwitchToSignup }: AuthModalProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Focus states for input fields
  const [usernameIsFocused, setUsernameIsFocused] = useState(false);
  const [emailIsFocused, setEmailIsFocused] = useState(false);
  const [passwordIsFocused, setPasswordIsFocused] = useState(false);
  const [confirmPasswordIsFocused, setConfirmPasswordIsFocused] = useState(false);

  const handleAuth = async () => {
    if (type === 'login') {
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }
    } else {
      if (!username || !email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setError('');
    setIsLoading(true);

    try {
      // Simulate a brief loading period
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Redirect to home page
      router.push('/(tabs)/home');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{type === 'login' ? 'Log In' : 'Create Account'}</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#666" />
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={18} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {type === 'signup' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={[styles.inputWrapper, usernameIsFocused && styles.inputWrapperFocused]}>
                <Feather name="user" size={20} color={usernameIsFocused ? "#6B2FBC" : "#999"} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, webStyles]}
                  placeholder="Choose a username"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setUsernameIsFocused(true)}
                  onBlur={() => setUsernameIsFocused(false)}
                  blurOnSubmit
                  textContentType="username"
                />
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.inputWrapper, emailIsFocused && styles.inputWrapperFocused]}>
              <Feather name="mail" size={20} color={emailIsFocused ? "#6B2FBC" : "#999"} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, webStyles]}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailIsFocused(true)}
                onBlur={() => setEmailIsFocused(false)}
                textContentType="emailAddress"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.inputWrapper, passwordIsFocused && styles.inputWrapperFocused]}>
              <Feather name="lock" size={20} color={passwordIsFocused ? "#6B2FBC" : "#999"} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, webStyles]}
                placeholder={type === 'login' ? "Enter your password" : "Create a password"}
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordIsFocused(true)}
                onBlur={() => setPasswordIsFocused(false)}
                textContentType="password"
              />
              <Pressable 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <Feather 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={passwordIsFocused ? "#6B2FBC" : "#999"} 
                />
              </Pressable>
            </View>
          </View>

          {type === 'signup' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[styles.inputWrapper, confirmPasswordIsFocused && styles.inputWrapperFocused]}>
                <Feather name="lock" size={20} color={confirmPasswordIsFocused ? "#6B2FBC" : "#999"} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, webStyles]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setConfirmPasswordIsFocused(true)}
                  onBlur={() => setConfirmPasswordIsFocused(false)}
                  textContentType="password"
                />
              </View>
            </View>
          )}

          {type === 'login' && (
            <Pressable style={styles.forgotPasswordButton}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>
          )}

          {type === 'signup' && (
            <Text style={styles.termsText}>
              By signing up, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          )}

          <Pressable 
            style={[styles.authButton, isLoading && styles.authButtonDisabled]}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.authButtonText}>
                {type === 'login' ? 'Logging in...' : 'Creating account...'}
              </Text>
            ) : (
              <Text style={styles.authButtonText}>
                {type === 'login' ? 'Log In' : 'Create Account'}
              </Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {type === 'login' ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <Pressable onPress={() => {
              resetForm();
              onClose();
              // Switch to the other modal
              if (type === 'login' && onSwitchToSignup) {
                onSwitchToSignup();
              } else if (type === 'signup' && onSwitchToLogin) {
                onSwitchToLogin();
              }
            }}>
              <Text style={styles.switchLink}>
                {type === 'login' ? 'Sign Up' : 'Log In'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const modalWidth = Math.min(width - 40, 400);

// Create a web-specific style object for input outlines
const webStyles = Platform.select({
  web: {
    outlineWidth: 0,
    outlineColor: 'transparent',
    outlineStyle: 'none',
  },
  default: {},
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: modalWidth,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdeaea',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#e74c3c',
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 12,
    backgroundColor: '#F9F9F9',
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#6B2FBC',
    borderWidth: 2,
    paddingLeft: 15,
    paddingRight: 11,
    shadowColor: '#6B2FBC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 16,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
    paddingLeft: 8,
    paddingRight: 8,
  },
  passwordToggle: {
    padding: 8,
    marginRight: -4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#6B2FBC',
    fontSize: 14,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  termsLink: {
    color: '#6B2FBC',
    fontWeight: '500',
  },
  authButton: {
    backgroundColor: '#6B2FBC',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6B2FBC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  authButtonDisabled: {
    backgroundColor: '#9D7BC7',
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E1E1',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#999',
    fontSize: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#666',
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B2FBC',
    marginLeft: 4,
  },
});
