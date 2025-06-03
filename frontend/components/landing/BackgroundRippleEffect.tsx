import React, { useEffect, useRef } from "react";
import {
	View,
	StyleSheet,
	Dimensions,
	Platform,
	Animated,
	Easing,
} from "react-native";

const { width, height } = Dimensions.get("window");

const RIPPLE_CONFIG = [
	{
		id: "1",
		sizeFactor: 0.9,
		initialDelay: 0,
		duration: 3000,
		styleKey: "ripple1",
		container: "rippleContainer",
	},
	{
		id: "2",
		sizeFactor: 0.75,
		initialDelay: 500,
		duration: 3500,
		styleKey: "ripple2",
		container: "rippleContainer",
	},
	{
		id: "3",
		sizeFactor: 0.6,
		initialDelay: 1000,
		duration: 4000,
		styleKey: "ripple3",
		container: "rippleContainer",
	},
	{
		id: "4",
		sizeFactor: 0.45,
		initialDelay: 1500,
		duration: 3000,
		styleKey: "ripple4",
		container: "rippleContainer",
	},
	{
		id: "5",
		sizeFactor: 0.3,
		initialDelay: 200,
		duration: 3200,
		styleKey: "ripple5",
		container: "rippleContainer2",
	},
	{
		id: "6",
		sizeFactor: 0.15,
		initialDelay: 700,
		duration: 3800,
		styleKey: "ripple6",
		container: "rippleContainer2",
	},
	{
		id: "7",
		sizeFactor: 0.7,
		initialDelay: 1200,
		duration: 4500,
		styleKey: "ripple7",
		container: "rippleContainer2",
	},
	{
		id: "8",
		sizeFactor: 0.4,
		initialDelay: 1700,
		duration: 2800,
		styleKey: "ripple8",
		container: "rippleContainer2",
	},
];

const Ripple = ({
	id,
	sizeFactor,
	initialDelay,
	duration,
	styleKey,
}: (typeof RIPPLE_CONFIG)[0]) => {
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const opacityAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		const animation = Animated.loop(
			Animated.sequence([
				Animated.delay(initialDelay),
				Animated.parallel([
					Animated.timing(scaleAnim, {
						toValue: 1,
						duration: duration,
						easing: Easing.out(Easing.ease),
						useNativeDriver: true,
					}),
					Animated.timing(opacityAnim, {
						toValue: 0,
						duration: duration,
						easing: Easing.in(Easing.ease),
						useNativeDriver: true,
					}),
				]),
			])
		);
		animation.start();
		return () => animation.stop();
	}, [scaleAnim, opacityAnim, initialDelay, duration]);

	const dynamicStyle = styles[styleKey as keyof typeof styles];

	return (
		<Animated.View
			style={[
				styles.ripple,
				dynamicStyle,
				{
					transform: [{ scale: scaleAnim }],
					opacity: opacityAnim,
				},
			]}
		/>
	);
};

const BackgroundRippleEffect = () => {
	return (
		<View style={styles.backgroundAnimations}>
			<View style={styles.rippleContainer}>
				{RIPPLE_CONFIG.filter((r) => r.container === "rippleContainer").map(
					(config) => (
						<Ripple key={config.id} {...config} />
					)
				)}
			</View>
			<View style={styles.rippleContainer2}>
				{RIPPLE_CONFIG.filter((r) => r.container === "rippleContainer2").map(
					(config) => (
						<Ripple key={config.id} {...config} />
					)
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	backgroundAnimations: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 0, // Ensure it's behind other content
	},
	rippleContainer: {
		position: "absolute",
		width: width * 0.9,
		height: width * 0.9,
		top: height * 0.05,
		left: -width * 0.4,
		// opacity: Platform.OS === 'web' ? 0.3 : 0.5, // Opacity now handled by individual ripple animation
		justifyContent: "center",
		alignItems: "center",
	},
	rippleContainer2: {
		position: "absolute",
		width: width * 0.7,
		height: width * 0.7,
		bottom: height * 0.1,
		right: -width * 0.3,
		// opacity: Platform.OS === 'web' ? 0.3 : 0.5, // Opacity now handled by individual ripple animation
		justifyContent: "center",
		alignItems: "center",
	},
	ripple: {
		// Common style for all ripples, specific dimensions/colors in individual styles
		position: "absolute",
		borderWidth: 2, // Base borderWidth
		// borderColor handled by specific ripple styles for variety
		// borderRadius handled by specific ripple styles (half of width/height)
	},
	ripple1: {
		width: width * 0.9,
		height: width * 0.9,
		borderRadius: width * 0.45,
		borderColor: "rgba(138, 79, 214, 0.7)",
		borderWidth: 3,
	},
	ripple2: {
		width: width * 0.75,
		height: width * 0.75,
		borderRadius: width * 0.375,
		borderColor: "rgba(157, 123, 199, 0.65)",
		borderWidth: 2.5,
	},
	ripple3: {
		width: width * 0.6,
		height: width * 0.6,
		borderRadius: width * 0.3,
		borderColor: "rgba(212, 193, 236, 0.7)",
	},
	ripple4: {
		width: width * 0.45,
		height: width * 0.45,
		borderRadius: width * 0.225,
		borderColor: "rgba(138, 79, 214, 0.75)",
		borderWidth: 2,
	},
	ripple5: {
		width: width * 0.3,
		height: width * 0.3,
		borderRadius: width * 0.15,
		borderColor: "rgba(157, 123, 199, 0.8)",
		borderWidth: 2,
	},
	ripple6: {
		width: width * 0.15,
		height: width * 0.15,
		borderRadius: width * 0.075,
		borderColor: "rgba(212, 193, 236, 0.85)",
	},
	ripple7: {
		width: width * 0.7,
		height: width * 0.7,
		borderRadius: width * 0.35,
		borderColor: "rgba(138, 79, 214, 0.7)",
		borderWidth: 2.5,
	},
	ripple8: {
		width: width * 0.4,
		height: width * 0.4,
		borderRadius: width * 0.2,
		borderColor: "rgba(157, 123, 199, 0.8)",
		borderWidth: 2,
	},
});

export default BackgroundRippleEffect;
