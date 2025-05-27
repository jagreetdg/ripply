import { StyleSheet, Platform } from "react-native";
import Colors, { hexToRgba, opacityValues } from "../../constants/Colors";

// Convert StyleSheet.create to a function that accepts colors and isDarkMode
export const getStyles = (
  colors: any,
  isDarkMode: boolean,
  hasBackgroundImage: boolean
) =>
  StyleSheet.create({
    cardOuterContainer: {
      borderRadius: 16,
      marginVertical: 8, // Add some vertical margin between cards
      marginHorizontal: Platform.OS === "web" ? 8 : 0, // Horizontal margin for web
      // Add shadow for a more elevated look
      shadowColor: colors.shadow, // Use a theme color for shadow
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3, // For Android
      backgroundColor: colors.background, // Important for shadow to show correctly
    },
    container: {
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: hasBackgroundImage ? colors.background : colors.card,
    },
    plainContainer: {
      borderWidth: 1,
      borderColor: colors.border, // Theme border color
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      // Overlay opacity is now set dynamically in the component for adaptive intensity
      borderRadius: 16, // Match container
    },
    repostAttributionContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopLeftRadius: 16, // Match card radius
      borderTopRightRadius: 16, // Match card radius
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode 
        ? hexToRgba(colors.white, opacityValues.soft) 
        : hexToRgba(colors.black, opacityValues.minimal),
      // backgroundColor is set dynamically
    },
    repostAttributionContainerOnImage: {
      // Special styles for repost attribution on image backgrounds
      borderBottomColor: hexToRgba(colors.white, opacityValues.soft),
      paddingVertical: 10, // Slightly taller
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
    },
    repostAttributionText: {
      fontSize: 12,
      fontWeight: "500",
      // color is set dynamically
    },
    repostAttributionTextOnImage: {
      fontSize: 12,
      fontWeight: "500",
      textShadowColor: hexToRgba(colors.black, opacityValues.heavy),
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    repostAttributionUsername: {
      fontWeight: "bold",
      // color is set dynamically
    },
    repostAttributionUsernameOnImage: {
      fontWeight: "bold",
      textShadowColor: hexToRgba(colors.black, opacityValues.heavy),
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    content: {
      padding: 16,
      // For cards with background image, content background should be transparent
      backgroundColor: colors.transparent,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    userInfoContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    userInfo: {
      marginLeft: 10,
      justifyContent: "center",
    },
    displayName: {
      fontWeight: "bold",
      fontSize: 14,
      color: colors.text, // Themed text color
    },
    username: {
      fontSize: 12,
      color: colors.textSecondary, // Themed secondary text color
    },
    displayNameOnImage: {
      fontWeight: "bold",
      fontSize: 14,
      color: colors.card, // Typically white or light color on dark image
      textShadowColor: "rgba(0, 0, 0, 1.0)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    usernameOnImage: {
      fontSize: 12,
      color: colors.card, // Typically white or light color on dark image
      opacity: 0.95,
      textShadowColor: "rgba(0, 0, 0, 0.9)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    timePosted: {
      fontSize: 12,
      color: colors.textSecondary,
      marginRight: 8,
    },
    timePostedOnImage: {
      fontSize: 12,
      color: colors.card, // Typically white or light color
      opacity: 0.95,
      marginRight: 8,
      textShadowColor: "rgba(0, 0, 0, 0.9)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    optionsButton: {
      padding: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 12,
      color: colors.text, // Themed text color
    },
    titleOnImage: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 12,
      color: colors.card, // Typically white or light color
      textShadowColor: "rgba(0, 0, 0, 1.0)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 5,
    },
    playerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    playButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.tint, // Themed tint color
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    playButtonOnImage: {
      backgroundColor: "rgba(255, 255, 255, 0.9)", // More opaque white for better visibility
    },
    progressContainer: {
      flex: 1,
      height: 24, // Increased height for easier touch
      justifyContent: "center",
      position: "relative",
      marginRight: 12,
    },
    progressBackground: {
      position: "absolute",
      width: "100%",
      height: 6, // Thicker bar
      backgroundColor: isDarkMode
        ? hexToRgba(colors.white, opacityValues.soft)
        : hexToRgba(colors.black, opacityValues.light),
      borderRadius: 3,
      top: 9, // Center it (24-6)/2
    },
    progressBackgroundOnImage: {
      backgroundColor: hexToRgba(colors.white, opacityValues.moderate), // Brighter background for better visibility on images
    },
    progressBar: {
      position: "absolute",
      height: 6,
      backgroundColor: colors.tint, // Themed tint color
      borderRadius: 3,
      top: 9, // Center it
    },
    progressBarOnImage: {
      backgroundColor: "#FFFFFF", // Bright white progress for better visibility on images
    },
    progressKnob: {
      position: "absolute",
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.tint, // Themed tint color
      top: 6, // Center the larger knob
      borderWidth: 2,
      borderColor: colors.card, // Typically white/light color
    },
    progressKnobOnImage: {
      borderColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent white for visibility
      backgroundColor: "#FFFFFF", // Pure white knob
      width: 14,
      height: 14,
      borderRadius: 7,
      top: 5, // Adjust for larger size
      borderWidth: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3,
    },
    duration: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    durationOnImage: {
      color: colors.card,
      textShadowColor: "rgba(0, 0, 0, 0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 12,
    },
    tagItem: {
      backgroundColor: isDarkMode
        ? hexToRgba(colors.white, opacityValues.light)
        : hexToRgba(colors.black, opacityValues.minimal),
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginRight: 8,
      marginBottom: 8,
    },
    tagItemOnImage: {
      backgroundColor: hexToRgba(colors.black, opacityValues.semitransparent), // Darker background for better visibility
      borderColor: hexToRgba(colors.white, opacityValues.medium), // Brighter border for better visibility
      borderWidth: 1,
    },
    tagText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tagTextOnImage: {
      color: colors.white,
      fontSize: 12,
      fontWeight: "600",
      textShadowColor: hexToRgba(colors.black, opacityValues.nearsolid),
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    interactions: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: colors.border, // Themed border color
    },
    interactionsOnImage: {
      borderTopColor: "rgba(255, 255, 255, 0.3)", // Slightly more visible border
    },
    interactionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
    },
    interactionContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    interactionCount: {
      marginLeft: 4,
      fontSize: 12,
      fontWeight: "600",
    },
    interactionText: {
      marginLeft: 4,
      fontSize: 12,
      fontWeight: "600",
    },
    interactionTextOnImage: {
      marginLeft: 4,
      fontSize: 12,
      fontWeight: "600",
      // Let the original theme color flow through
    },
    iconOnImage: {
      // Add a subtle glow effect
      textShadowColor: "rgba(0, 0, 0, 0.8)",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 3,
    },
    likedIcon: {
      // Add any specific styling for the liked state
    },
    // Styles for the seek bar touch areas
    seekBarHitSlop: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
    tagsContainerOnImage: {
      marginTop: 8,
      flexDirection: "row",
      flexWrap: "wrap",
    },
    tagOnImage: {
      backgroundColor: hexToRgba(colors.white, opacityValues.soft),
      borderWidth: 1,
      borderColor: hexToRgba(colors.white, opacityValues.strong), // Brighter border for visibility
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginRight: 8,
      marginBottom: 8,
    },
  }); 