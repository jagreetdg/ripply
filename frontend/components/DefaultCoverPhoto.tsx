import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G } from "react-native-svg";

interface DefaultCoverPhotoProps {
	width?: number;
	height?: number;
	style?: object;
}

/**
 * A unified default cover photo component that displays a purple gradient with circular ripples
 * Used across the app as a standard default cover photo
 */
const DefaultCoverPhoto = ({
	width = 400,
	height = 150,
	style,
}: DefaultCoverPhotoProps) => {
	return (
		<View style={[{ width, height }, style]}>
			<LinearGradient
				colors={["#A06EE5", "#BF9AF9", "#D994FA"]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={StyleSheet.absoluteFillObject}
			/>
			<Svg
				width={width}
				height={height}
				viewBox={`0 0 ${width} ${height}`}
				style={StyleSheet.absoluteFillObject}
			>
				<G opacity={0.3}>
					{/* First ripple group */}
					<Circle
						cx={width * 0.25}
						cy={height * 0.5}
						r={height * 0.2}
						fill="none"
						stroke="rgba(255,255,255,0.4)"
						strokeWidth="2"
					/>
					<Circle
						cx={width * 0.25}
						cy={height * 0.5}
						r={height * 0.3}
						fill="none"
						stroke="rgba(255,255,255,0.3)"
						strokeWidth="1.5"
					/>
					<Circle
						cx={width * 0.25}
						cy={height * 0.5}
						r={height * 0.4}
						fill="none"
						stroke="rgba(255,255,255,0.2)"
						strokeWidth="1"
					/>

					{/* Second ripple group */}
					<Circle
						cx={width * 0.5}
						cy={height * 0.375}
						r={height * 0.15}
						fill="none"
						stroke="rgba(255,255,255,0.4)"
						strokeWidth="2"
					/>
					<Circle
						cx={width * 0.5}
						cy={height * 0.375}
						r={height * 0.225}
						fill="none"
						stroke="rgba(255,255,255,0.3)"
						strokeWidth="1.5"
					/>
					<Circle
						cx={width * 0.5}
						cy={height * 0.375}
						r={height * 0.3}
						fill="none"
						stroke="rgba(255,255,255,0.2)"
						strokeWidth="1"
					/>

					{/* Third ripple group */}
					<Circle
						cx={width * 0.75}
						cy={height * 0.625}
						r={height * 0.175}
						fill="none"
						stroke="rgba(255,255,255,0.4)"
						strokeWidth="2"
					/>
					<Circle
						cx={width * 0.75}
						cy={height * 0.625}
						r={height * 0.25}
						fill="none"
						stroke="rgba(255,255,255,0.3)"
						strokeWidth="1.5"
					/>
					<Circle
						cx={width * 0.75}
						cy={height * 0.625}
						r={height * 0.325}
						fill="none"
						stroke="rgba(255,255,255,0.2)"
						strokeWidth="1"
					/>
				</G>
			</Svg>
		</View>
	);
};

export default DefaultCoverPhoto;
