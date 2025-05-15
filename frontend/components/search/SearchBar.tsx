import React from "react";
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
	return (
		<View style={styles.container}>
			<View style={styles.searchContainer}>
				<Feather
					name="search"
					size={20}
					color="#888"
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
	},
	searchIcon: {
		marginRight: 8,
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: "#333",
		height: "100%",
	},
	clearButton: {
		padding: 4,
	},
});
