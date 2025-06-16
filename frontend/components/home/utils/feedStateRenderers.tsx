import React from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

interface FeedStateProps {
	colors: any;
	headerPadding: number;
	onRefresh?: () => Promise<void>;
}

interface EmptyStateProps extends FeedStateProps {
	diagnosticData?: any;
}

export const LoadingState: React.FC<FeedStateProps> = ({
	colors,
	headerPadding,
}) => (
	<View
		style={[
			styles.loadingContainer,
			{ backgroundColor: colors.background, paddingTop: headerPadding },
		]}
	>
		<ActivityIndicator size="large" color={colors.tint} />
		<Text style={[styles.loadingText, { color: colors.textSecondary }]}>
			Loading voice notes...
		</Text>
	</View>
);

export const ErrorState: React.FC<FeedStateProps> = ({
	colors,
	headerPadding,
	onRefresh,
}) => (
	<View
		style={[
			styles.errorContainer,
			{ backgroundColor: colors.background, paddingTop: headerPadding },
		]}
	>
		<Text style={[styles.errorText, { color: colors.error }]}>
			Something went wrong. Please try again.
		</Text>
		{onRefresh && (
			<TouchableOpacity
				style={[styles.retryButton, { backgroundColor: colors.tint }]}
				onPress={onRefresh}
			>
				<Text style={[styles.retryButtonText, { color: colors.white }]}>
					Retry
				</Text>
			</TouchableOpacity>
		)}
	</View>
);

export const EmptyState: React.FC<EmptyStateProps> = ({
	colors,
	headerPadding,
	diagnosticData,
}) => {
	const router = useRouter();

	const isNotFollowingAnyone =
		diagnosticData?.summary?.isFollowingAnyone === false;

	return (
		<View
			style={[
				styles.emptyContainer,
				{ backgroundColor: colors.background, paddingTop: headerPadding },
			]}
		>
			<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
				{isNotFollowingAnyone
					? "Your feed is empty because you're not following anyone yet."
					: "No voice notes found. Check back later for new content."}
			</Text>

			{isNotFollowingAnyone && (
				<TouchableOpacity
					style={[styles.discoverButton, { backgroundColor: colors.tint }]}
					onPress={() => router.push("/(tabs)/search")}
				>
					<Text style={[styles.discoverButtonText, { color: colors.card }]}>
						Discover Users
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};

export const FooterLoader: React.FC<{ colors: any }> = ({ colors }) => (
	<View style={styles.footerLoader}>
		<ActivityIndicator size="small" color={colors.tint} />
		<Text style={[styles.footerText, { color: colors.textSecondary }]}>
			Loading more...
		</Text>
	</View>
);

const styles = {
	loadingContainer: {
		flex: 1,
		justifyContent: "center" as const,
		alignItems: "center" as const,
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center" as const,
		alignItems: "center" as const,
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		textAlign: "center" as const,
		marginBottom: 16,
	},
	retryButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
	},
	retryButtonText: {
		fontWeight: "bold" as const,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center" as const,
		alignItems: "center" as const,
		padding: 40,
	},
	emptyText: {
		fontSize: 16,
		textAlign: "center" as const,
	},
	discoverButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
		marginTop: 10,
	},
	discoverButtonText: {
		fontWeight: "bold" as const,
	},
	footerLoader: {
		flexDirection: "row" as const,
		justifyContent: "center" as const,
		alignItems: "center" as const,
		paddingVertical: 20,
	},
	footerText: {
		marginLeft: 10,
		fontSize: 14,
	},
};
