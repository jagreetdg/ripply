import React, { useState, useRef, useEffect } from "react";
import {
	View,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface SearchBarProps {
	value: string;
	onChangeText: (text: string) => void;
	onSubmit?: () => void;
	onClear?: () => void;
	placeholder?: string;
}

export const SearchBar = ({
	value,
	onChangeText,
	onSubmit,
	onClear,
	placeholder = "Search...",
}: SearchBarProps) => {
	const [isFocused, setIsFocused] = useState(false);
	const inputRef = useRef<TextInput>(null);

	// Update focus handling based on value changes from props
	useEffect(() => {
		// When a new search term is set via props, focus the input
		if (value && value.length > 0 && !isFocused && inputRef.current) {
			// Give time for the component to render with the new value
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}
	}, [value]);

	const handleClear = () => {
		if (onClear) {
			onClear();
		}
		// After clearing, focus the input again
		setTimeout(() => {
			inputRef.current?.focus();
		}, 50);
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity
				activeOpacity={0.9}
				style={[
					styles.searchContainer,
					isFocused && styles.searchContainerFocused,
				]}
				onPress={() => inputRef.current?.focus()}
			>
				<Feather
					name="search"
					size={20}
					color={isFocused ? "#6B2FBC" : "#888"}
					style={styles.searchIcon}
				/>
				<TextInput
					ref={inputRef}
					style={styles.input}
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor="#888"
					returnKeyType="search"
					onSubmitEditing={onSubmit}
					autoCapitalize="none"
					autoCorrect={false}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					underlineColorAndroid="transparent"
					selectionColor="#6B2FBC"
					spellCheck={false}
					// Remove auto keyboard hiding on web
					blurOnSubmit={Platform.OS !== "web"}
				/>
				{value.length > 0 && (
					<TouchableOpacity onPress={handleClear} style={styles.clearButton}>
						<Feather name="x" size={18} color="#888" />
					</TouchableOpacity>
				)}
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: "100%",
		padding: 12,
		backgroundColor: "#fff",
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f2f2f2",
		borderRadius: 10,
		paddingHorizontal: 12,
		height: 44,
		borderWidth: 1,
		borderColor: "transparent",
	},
	searchContainerFocused: {
		borderColor: "#6B2FBC",
		backgroundColor: "#fff",
		shadowColor: "#6B2FBC",
		shadowOffset: {
			width: 0,
			height: 0,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	searchIcon: {
		marginRight: 12,
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: "#333",
		height: "100%",
		paddingLeft: 8,
		// Remove default styling
		...(Platform.OS === "web"
			? {
					outlineStyle: "none",
					outlineWidth: 0,
					outlineColor: "transparent",
					WebkitAppearance: "none",
			  }
			: {}),
	},
	clearButton: {
		padding: 4,
	},
});
