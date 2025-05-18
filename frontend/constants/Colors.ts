const tintColorLight = '#6B2FBC'; // Ripply Purple
const tintColorDark = '#A076F9'; // Lighter Ripply Purple for dark mode

export default {
  light: {
    text: '#121212', // Darker grey, not pure black
    textSecondary: '#5C5C5C', // Medium grey for less important text
    background: '#F5F5F5', // Light grey background
    card: '#FFFFFF', // White for cards
    tint: tintColorLight,
    tabIconDefault: '#8A8A8A', // Grey for inactive tabs
    tabIconSelected: tintColorLight,
    border: '#E0E0E0', // Light border color
    shadow: '#000000', // Shadow color for light mode
    liked: '#E53935', // Red for liked items
    reposted: '#4CAF50', // Green for reposted items
    repostedOnImage: '#66BB6A', // Slightly lighter green for on-image reposts
    tagBackground: 'rgba(107, 47, 188, 0.1)', // Light purple for tags
    tagBorder: 'rgba(107, 47, 188, 0.3)',
  },
  dark: {
    text: '#E0E0E0', // Light grey text for dark mode
    textSecondary: '#A0A0A0', // Lighter medium grey for dark mode
    background: '#121212', // Very dark grey, almost black
    card: '#1E1E1E', // Dark grey for cards in dark mode
    tint: tintColorDark,
    tabIconDefault: '#7A7A7A', // Darker grey for inactive tabs in dark mode
    tabIconSelected: tintColorDark,
    border: '#3A3A3A', // Darker border color
    shadow: '#000000', // Shadow color for dark mode (often less visible or different style)
    liked: '#EF5350', // Slightly lighter red for dark mode
    reposted: '#66BB6A', // Lighter green for dark mode
    repostedOnImage: '#81C784', // Even lighter green for on-image reposts in dark mode
    tagBackground: 'rgba(160, 118, 249, 0.15)', // Darker, less vibrant purple for tags
    tagBorder: 'rgba(160, 118, 249, 0.4)',
  },
};
