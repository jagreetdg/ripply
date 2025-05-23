import React from "react";
import { View } from "react-native";
import Svg, { Circle, Path, G } from "react-native-svg";

interface SearchDiscoveryIconProps {
	size?: number;
	color?: string;
	showSearch?: boolean; // true for search mode, false for discovery mode
}

export const SearchDiscoveryIcon = ({
	size = 24,
	color = "#000",
	showSearch = true,
}: SearchDiscoveryIconProps) => {
	return (
		<View style={{ width: size, height: size }}>
			<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
				{showSearch ? (
					// Search icon with compass needle
					<G>
						{/* Magnifying glass circle */}
						<Circle
							cx="11"
							cy="11"
							r="8"
							stroke={color}
							strokeWidth="2"
							fill="none"
						/>
						{/* Compass needle inside the glass */}
						<Path d="M8 11l3-2 3 2-3 2z" fill={color} opacity="0.6" />
						{/* Magnifying glass handle */}
						<Path
							d="m21 21-4.35-4.35"
							stroke={color}
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</G>
				) : (
					// Discovery icon (compass with search hint)
					<G>
						{/* Compass circle */}
						<Circle
							cx="12"
							cy="12"
							r="10"
							stroke={color}
							strokeWidth="2"
							fill="none"
						/>
						{/* Compass needle */}
						<Path d="M12 2l3 8-3 2-3-2z" fill={color} />
						{/* Small search hint */}
						<Circle
							cx="16"
							cy="8"
							r="2"
							stroke={color}
							strokeWidth="1"
							fill="none"
							opacity="0.6"
						/>
					</G>
				)}
			</Svg>
		</View>
	);
};
