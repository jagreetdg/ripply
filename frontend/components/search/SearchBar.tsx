import React, { useState } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
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

	return (
		<View style={styles.container}>
			<View
				style={[
					styles.searchContainer,
					isFocused && styles.searchContainerFocused,
				]}
			>
				<Feather
					name="search"
					size={20}
					color={isFocused ? "#6B2FBC" : "#888"}
					style={styles.searchIcon}
				/>
				<TextInput
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
				/>
				{value.length > 0 && (
					<TouchableOpacity onPress={onClear} style={styles.clearButton}>
						<Feather name="x" size={18} color="#888" />
					</TouchableOpacity>
				)}
			</View>
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
		outlineStyle: "none",
	},
	clearButton: {
		padding: 4,
	},
});
