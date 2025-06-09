import { useRef, useEffect } from "react";
import { Animated } from "react-native";

export const useProfileAnimations = (onHeaderCollapseChange: (collapsed: boolean) => void) => {
	const scrollY = useRef(new Animated.Value(0)).current;
	const headerHeight = useRef(new Animated.Value(0)).current;
	const headerOpacity = useRef(new Animated.Value(1)).current;
	const collapsedHeaderOpacity = useRef(new Animated.Value(0)).current;

	// Add a listener to scrollY to update header collapse state
	useEffect(() => {
		const listenerId = scrollY.addListener(({ value }) => {
			// Calculate progress of collapse (0 to 1)
			const COLLAPSE_THRESHOLD = 120;
			const COLLAPSE_RANGE = 40;

			// Calculate progress between 0 and 1 based on scroll position
			const progress = Math.max(
				0,
				Math.min(
					1,
					(value - (COLLAPSE_THRESHOLD - COLLAPSE_RANGE)) / COLLAPSE_RANGE
				)
			);

			// Update the animated values based on progress
			headerOpacity.setValue(1 - progress);
			collapsedHeaderOpacity.setValue(progress);

			// Update the collapsed state for conditional logic
			onHeaderCollapseChange(progress > 0.5);
		});

		return () => {
			scrollY.removeListener(listenerId);
		};
	}, [scrollY, onHeaderCollapseChange]);

	return {
		scrollY,
		headerHeight,
		headerOpacity,
		collapsedHeaderOpacity,
	};
}; 