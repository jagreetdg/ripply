const tintColorLight = '#6B2FBC'; // Ripply Purple
const tintColorDark = '#A076F9'; // Lighter Ripply Purple for dark mode

/**
 * Converts a hex color and opacity value to an rgba color string
 * @param hex - Hex color code (with or without hash)
 * @param opacity - Opacity value between 0 and 1
 * @returns RGBA color string
 */
export function hexToRgba(hex: string, opacity: number): string {
  // Remove hash if present
  hex = hex.replace('#', '');
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Predefined opacity values for consistent transparency
 */
export const opacityValues = {
  none: 0,
  minimal: 0.05,
  light: 0.1,
  soft: 0.2,
  medium: 0.25,
  moderate: 0.4,
  semitransparent: 0.5,
  strong: 0.65,
  heavy: 0.75,
  intense: 0.85,
  nearsolid: 0.9,
  solid: 1
};

const Colors = {
  light: {
    text: '#121212', // Darker grey, not pure black
    textSecondary: '#5C5C5C', // Medium grey for less important text
    textTertiary: '#8A8A8A', // For placeholder text or less important details
    background: '#F5F5F5', // Light grey background
    card: '#FFFFFF', // White for cards
    tint: tintColorLight,
    tabIconDefault: '#8A8A8A', // Grey for inactive tabs
    tabIconSelected: tintColorLight,
    border: '#E0E0E0', // Light border color
    shadow: '#000000', // Shadow color for light mode
    liked: '#E53935', // Red for liked items
    likedOnImage: '#FF80AB', // Light pink for liked items on image backgrounds
    reposted: '#4CAF50', // Green for reposted items
    repostedOnImage: '#76FF03', // Bright green for reposted items on image backgrounds
    tagBackground: 'rgba(107, 47, 188, 0.1)', // Light purple for tags
    tagBorder: 'rgba(107, 47, 188, 0.3)',
    // New additions
    white: '#FFFFFF',
    black: '#000000',
    grey: '#808080',
    lightGrey: '#D3D3D3',
    mediumGrey: '#A9A9A9',
    darkGrey: '#696969',
    error: '#e74c3c', // Strong red for errors
    success: '#2ecc71', // Green for success
    info: '#3498db',    // Blue for informational messages
    warning: '#fbbc04', // Yellow/Orange for warnings
    transparent: 'transparent',
    modalOverlay: 'rgba(0, 0, 0, 0.5)', // Standard modal overlay
    // Form fields
    inputBorder: '#E0E0E0',
    inputFocused: '#6B2FBC',
    inputText: '#333333',
    inputPlaceholder: '#999999',
    // Shadows
    shadowLight: 'rgba(0, 0, 0, 0.1)',
    shadowMedium: 'rgba(0, 0, 0, 0.2)',
    shadowDark: 'rgba(0, 0, 0, 0.3)',
  },
  dark: {
    text: '#E0E0E0', // Light grey text for dark mode
    textSecondary: '#A0A0A0', // Lighter medium grey for dark mode
    textTertiary: '#9E9E9E', // Lightened for better contrast
    background: '#121212', // Very dark grey, almost black
    card: '#1E1E1E', // Dark grey for cards in dark mode
    tint: tintColorDark,
    tabIconDefault: '#7A7A7A', // Darker grey for inactive tabs in dark mode
    tabIconSelected: tintColorDark,
    border: '#3A3A3A', // Darker border color
    shadow: '#000000', // Shadow color for dark mode (often less visible or different style)
    liked: '#EF5350', // Slightly lighter red for dark mode
    likedOnImage: '#EF5350', // Revert to original dark mode color
    reposted: '#66BB6A', // Lighter green for dark mode
    repostedOnImage: '#81C784', // Revert to original dark mode color
    tagBackground: 'rgba(160, 118, 249, 0.15)', // Darker, less vibrant purple for tags
    tagBorder: 'rgba(160, 118, 249, 0.4)',
    // New additions (inverted/adjusted for dark mode)
    white: '#FFFFFF',
    black: '#000000',
    grey: '#808080', // Grey might stay same, or adjust if needed for contrast
    lightGrey: '#BDBDBD', // Significantly lightened for usability
    mediumGrey: '#7A7A7A',
    darkGrey: '#A9A9A9', // Lighter version of darkGrey for dark backgrounds
    error: '#FF6B6B', // Lighter, more visible red on dark backgrounds
    success: '#7ED321', // Lighter green
    info: '#54A0FF',    // Lighter blue
    warning: '#FFD166', // Lighter yellow/orange
    transparent: 'transparent',
    modalOverlay: 'rgba(0, 0, 0, 0.7)', // Darker overlay for dark mode potentially
    // Form fields
    inputBorder: '#3A3A3A',
    inputFocused: '#A076F9',
    inputText: '#E0E0E0',
    inputPlaceholder: '#666666',
    // Shadows
    shadowLight: 'rgba(0, 0, 0, 0.2)',
    shadowMedium: 'rgba(0, 0, 0, 0.4)',
    shadowDark: 'rgba(0, 0, 0, 0.6)',
  },
  // Brand colors (typically don't change with theme)
  brand: {
    // Google colors
    googleBlue: '#4285F4',
    googleGreen: '#34A853',
    googleYellow: '#FBBC04',
    googleRed: '#EA4335',
    // Apple
    appleBlack: '#000000',
    // Facebook
    facebookBlue: '#1877F2',
    // Twitter/X
    twitterBlue: '#1DA1F2',
    // Other social platforms
    instagramPurple: '#C13584',
    linkedinBlue: '#0077B5',
    
    // Ripply brand colors
    primary: '#6B2FBC', // Main purple
    secondary: '#9D7BC7', // Lighter purple
    tertiary: '#D4C1EC', // Very light purple
    accent: '#8A4FD6', // Bright purple accent
  },
  // Common opacity modifiers for RGBA colors - use with theme colors
  // Example: `${colors.primary}${opacity.heavy}`
  opacity: {
    light: '1A', // ~10%
    medium: '40', // ~25%
    strong: '80', // ~50%
    heavy: 'B3', // ~70%
    full: 'FF', // 100%
  }
};

// Common shadow styles
export const shadowStyles = {
  light: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  heavy: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  }
};

export default Colors;
