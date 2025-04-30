import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, Image, Animated, Easing, TouchableOpacity, Platform, ScrollView, ViewStyle, TextStyle, ImageStyle, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AuthModal from '../components/auth/AuthModal';
import AnimatedButton from '../components/landing/AnimatedButton';
import SocialAuthButton from '../components/landing/SocialAuthButton';
import AudioWaveform from '../components/landing/AudioWaveform';
import FeatureCard from '../components/landing/FeatureCard';
import TestimonialCard from '../components/landing/TestimonialCard';
import Section from '../components/landing/Section';
import GoogleIcon from '../assets/icons/googleIcon';
import AppleIcon from '../assets/icons/appleIcon';

export default function LandingPage() {
  const router = useRouter();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [signupModalVisible, setSignupModalVisible] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Staggered entrance animations for a premium feel
    Animated.sequence([
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        })
      ]),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      })
    ]).start();
  }, []);

  const handleLogin = () => {
    setLoginModalVisible(true);
  };
  
  const handleSignup = () => {
    setSignupModalVisible(true);
  };

  const handleGoogleAuth = () => {
    // Implement Google auth logic here
    console.log('Google auth pressed');
  };

  const handleAppleAuth = () => {
    // Implement Apple auth logic here
    console.log('Apple auth pressed');
  };

  // Features data
  const features = [
    {
      icon: 'mic' as React.ComponentProps<typeof Feather>['name'],
      title: 'Record a Ripple',
      description: 'Create a voice note in seconds. Express yourself with the power of your voice.',
      color: '#6B2FBC'
    },
    {
      icon: 'share-2' as React.ComponentProps<typeof Feather>['name'],
      title: 'Share with the world',
      description: 'Publish your Ripples to your followers or the public timeline.',
      color: '#9D7BC7'
    },
    {
      icon: 'repeat' as React.ComponentProps<typeof Feather>['name'],
      title: 'Get heard and interact',
      description: 'Receive likes, comments, and build a community around your voice.',
      color: '#D4C1EC'
    },
    {
      icon: 'trending-up' as React.ComponentProps<typeof Feather>['name'],
      title: 'Get Discovered',
      description: 'Gain exposure and build a fan following with your unique voice and talent.',
      color: '#8A4FD0'
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      quote: "Ripply has completely changed how I share my thoughts online. It's so much more personal than text.",
      name: "Alex Johnson",
      role: "Content Creator"
    },
    {
      quote: "As a musician, I use Ripply to share song snippets and get instant feedback from fans.",
      name: "Maya Williams",
      role: "Indie Artist"
    },
    {
      quote: "The voice-first approach makes social media feel human again. I'm addicted!",
      name: "Jamal Thompson",
      role: "Podcast Host"
    }
  ];

  return (
		<View style={styles.container}>
			<StatusBar 
				style="light" 
				translucent={true} 
				backgroundColor="transparent" 
				hidden={false}
			/>

			<LinearGradient
				colors={["#0F0524", "#1A0B2E", "#321A5B", "#4B2A89", "#6B2FBC", "#8A4FD6"]}
				start={{ x: 0, y: 0 }}
				end={{ x: 0.5, y: 1 }}
				locations={[0, 0.15, 0.35, 0.6, 0.85, 1]}
				style={styles.gradient}
			>
				{/* Background animations - Ripple effect */}
				<View style={styles.backgroundAnimations}>
					<View style={styles.rippleContainer}>
						<View style={[styles.ripple, styles.ripple1]} />
						<View style={[styles.ripple, styles.ripple2]} />
						<View style={[styles.ripple, styles.ripple3]} />
						<View style={[styles.ripple, styles.ripple4]} />
					</View>
					<View style={styles.rippleContainer2}>
						<View style={[styles.ripple, styles.ripple5]} />
						<View style={[styles.ripple, styles.ripple6]} />
						<View style={[styles.ripple, styles.ripple7]} />
						<View style={[styles.ripple, styles.ripple8]} />
					</View>
				</View>

				<SafeAreaView style={styles.safeArea}>
					<ScrollView contentContainerStyle={styles.scrollContent}>
						{/* Hero Section */}
						<View style={styles.heroSection}>
						<Animated.View
							style={[
								styles.heroContent,
								{
									opacity: titleAnim,
									transform: [{ translateY: slideAnim }],
								},
							]}
						>
							<Animated.Text style={[styles.heroTitle, { opacity: titleAnim }]}>
								Your Voice. Your Vibe. Your Ripple.
							</Animated.Text>

							<Animated.Text
								style={[styles.heroSubtitle, { opacity: subtitleAnim }]}
							>
								Turn your thoughts into Ripples & let them echo
								across the world !
							</Animated.Text>

							<Animated.View style={{ opacity: waveAnim, width: "100%", marginBottom: 30 }}>
								<AudioWaveform
									color="#6B2FBC"
									secondaryColor="#9D7BC7"
									height={60}
									barCount={36}
								/>
							</Animated.View>

							<Animated.View
								style={[styles.authButtonsContainer, { opacity: buttonAnim }]}
							>
								<View style={styles.buttonRow}>
									<AnimatedButton
										text="Log In"
										onPress={handleLogin}
										primary={false}
										icon="log-in"
										style={[styles.authButton, styles.loginButton] as any}
									/>

									<AnimatedButton
										text="Sign Up"
										onPress={handleSignup}
										primary={true}
										icon="user-plus"
										style={styles.authButton}
									/>
								</View>

								<View style={styles.divider}>
									<View style={styles.dividerLine} />
									<Text style={styles.dividerText}>or continue with</Text>
									<View style={styles.dividerLine} />
								</View>

								<View style={styles.socialButtonsRow}>
									<SocialAuthButton
										onPress={handleGoogleAuth}
										icon={<GoogleIcon size={24} />}
										style={styles.iconButton}
									/>

									<SocialAuthButton
										onPress={handleAppleAuth}
										icon={<AppleIcon size={24} />}
										style={styles.iconButton}
									/>
								</View>
							</Animated.View>
						</Animated.View>
					</View>

					{/* Simplified landing page - removed additional sections */}
				</ScrollView>
				</SafeAreaView>

				{/* Footer */}
				<View style={styles.footer}>
					<View style={styles.footerLinks}>
						<TouchableOpacity>
							<Text style={styles.footerLink}>Privacy</Text>
						</TouchableOpacity>
						<TouchableOpacity>
							<Text style={styles.footerLink}>Terms</Text>
						</TouchableOpacity>
						<TouchableOpacity>
							<Text style={styles.footerLink}>Contact</Text>
						</TouchableOpacity>
					</View>
					<Text style={styles.footerText}>
						{" "}
						2025 Ripply. All rights reserved.
					</Text>
				</View>
			</LinearGradient>

			{/* Authentication modals */}
			<AuthModal
				isVisible={loginModalVisible}
				onClose={() => setLoginModalVisible(false)}
				type="login"
				onSwitchToSignup={() => {
					setLoginModalVisible(false);
					setSignupModalVisible(true);
				}}
			/>

			<AuthModal
				isVisible={signupModalVisible}
				onClose={() => setSignupModalVisible(false)}
				type="signup"
				onSwitchToLogin={() => {
					setSignupModalVisible(false);
					setLoginModalVisible(true);
				}}
			/>
		</View>
	);
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0524', // Match the first color of the gradient
  },
  gradient: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundAnimations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  rippleContainer: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    top: height * 0.05,
    left: -width * 0.4,
    opacity: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rippleContainer2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    bottom: height * 0.1,
    right: -width * 0.3,
    opacity: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(107, 47, 188, 0.5)',
    borderRadius: 1000,
  },
  ripple1: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    borderColor: 'rgba(138, 79, 214, 0.7)',
    borderWidth: 3,
  },
  ripple2: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    borderColor: 'rgba(157, 123, 199, 0.65)',
    borderWidth: 2.5,
  },
  ripple3: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    borderColor: 'rgba(212, 193, 236, 0.7)',
  },
  ripple4: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: width * 0.225,
    borderColor: 'rgba(138, 79, 214, 0.75)',
    borderWidth: 2,
  },
  ripple5: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    borderColor: 'rgba(157, 123, 199, 0.8)',
    borderWidth: 2,
  },
  ripple6: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    borderColor: 'rgba(212, 193, 236, 0.85)',
  },
  ripple7: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    borderColor: 'rgba(138, 79, 214, 0.7)',
    borderWidth: 2.5,
  },
  ripple8: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    borderColor: 'rgba(157, 123, 199, 0.8)',
    borderWidth: 2,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Add padding for Android status bar
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80, // Space for footer
    alignItems: 'center',
  },
  heroSection: {
    width: '100%',
    minHeight: height - 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  heroContent: {
    width: '100%',
    maxWidth: 800,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: width < 380 ? 32 : 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(138, 79, 209, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#E0D1FF',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 30,
    maxWidth: 600,
  },
  featuresContainer: {
    flexDirection: width > 768 ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 1000,
  },
  featureCard: {
    marginBottom: 24,
    width: width > 768 ? '30%' : '100%',
    maxWidth: 320,
  },
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: 1000,
  },
  highlightItem: {
    width: width > 600 ? '30%' : '45%',
    alignItems: 'center',
    marginBottom: 30,
    marginHorizontal: 10,
  },
  highlightIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  testimonialsContainer: {
    flexDirection: width > 768 ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 1000,
  },
  testimonialCard: {
    marginBottom: 24,
    width: width > 768 ? '30%' : '100%',
    maxWidth: 320,
  },
  ctaSection: {
    width: '100%',
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  ctaContainer: {
    width: '100%',
    maxWidth: 800,
    borderRadius: 20,
    padding: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 18,
    color: '#E0D1FF',
    textAlign: 'center',
    marginBottom: 30,
  },
  ctaButtonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  ctaButton: {
    height: 56,
  },
  authButtonsContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'center',
    marginBottom: 16,
    alignItems: 'center',
    paddingHorizontal: 0,
    alignSelf: 'center',
    gap: 20,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: 10,
  },
  authButton: {
    width: '45%',
    height: 56,
    minWidth: 130,
    marginHorizontal: 0,
    flex: 1,
    maxWidth: '45%',
  },
  socialAuthButton: {
    width: '45%',
    height: 56,
    minWidth: 130,
    marginHorizontal: 0,
    flex: 1,
    maxWidth: '45%',
  },
  loginButton: {
    borderColor: '#D4C1EC',
    borderWidth: 2,
    backgroundColor: 'rgba(212, 193, 236, 0.25)',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    gap: 20,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(157, 123, 199, 0.5)',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(26, 11, 46, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerLinks: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  footerLink: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginHorizontal: 10,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
});
