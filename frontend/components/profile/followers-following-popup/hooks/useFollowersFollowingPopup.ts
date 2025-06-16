import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { useUser } from "../../../../context/UserContext";
import { getUserFollowers, getUserFollowing } from "../../../../services/api/userService";
import { UserType, FollowRelation, FollowersFollowingState } from "../types";

export const useFollowersFollowingPopup = (
	userId: string,
	initialTab: "followers" | "following",
	visible: boolean
) => {
	const router = useRouter();
	const { user: currentUser } = useUser();
	
	const [state, setState] = useState<FollowersFollowingState>({
		users: [],
		loading: true,
		mounted: false,
		renderKey: 0,
	});

	const isClosingRef = useRef(false);
	const hasRenderedOnceRef = useRef(false);
	const preventAutoCloseRef = useRef(false);

	// Determine if we're showing followers or following
	const isFollowersTab = initialTab === "followers";

	// Log mount/unmount for debugging
	useEffect(() => {
		console.log("FollowersFollowingPopup MOUNTED");
		setState(prev => ({ ...prev, mounted: true }));

		// Set a flag to prevent any auto-closing mechanisms
		preventAutoCloseRef.current = true;

		// After a short delay, allow closing
		const timer = setTimeout(() => {
			preventAutoCloseRef.current = false;
			console.log("FollowersFollowingPopup ready for user interaction");
		}, 1000);

		return () => {
			console.log("FollowersFollowingPopup UNMOUNTED");
			clearTimeout(timer);
			setState(prev => ({ ...prev, mounted: false }));
		};
	}, []);

	// Force a re-render after initial mount to ensure proper rendering
	useEffect(() => {
		if (state.mounted && !hasRenderedOnceRef.current) {
			hasRenderedOnceRef.current = true;
			// Force a re-render on next frame
			const timer = setTimeout(() => {
				setState(prev => ({ ...prev, renderKey: prev.renderKey + 1 }));
				console.log("FollowersFollowingPopup forced re-render for stability");
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [state.mounted]);

	// Memoize the fetchUsers function to prevent recreations on each render
	const fetchUsers = useCallback(async () => {
		if (!userId || !state.mounted) {
			console.log("No userId provided or component unmounted, skipping fetch");
			setState(prev => ({ ...prev, loading: false, users: [] }));
			return;
		}

		setState(prev => ({ ...prev, loading: true }));
		try {
			let userData: UserType[] = [];
			console.log(
				`Fetching ${isFollowersTab ? "followers" : "following"} users for user: ${userId}`
			);

			if (isFollowersTab) {
				userData = await getUserFollowers(userId);
				console.log(`Successfully fetched ${userData.length} followers`);
			} else {
				userData = await getUserFollowing(userId);
				console.log(`Successfully fetched ${userData.length} following`);
			}

			// Filter out any empty/invalid entries
			const validUsers = userData.filter(
				(user) => user && user.id && user.username
			);

			console.log(
				`Processed ${validUsers.length} valid ${
					isFollowersTab ? "followers" : "following"
				} users`
			);

			if (state.mounted) {
				setState(prev => ({ ...prev, users: validUsers }));
			}
		} catch (error) {
			console.error(
				`Error fetching ${isFollowersTab ? "followers" : "following"}:`,
				error
			);
			if (state.mounted) {
				setState(prev => ({ ...prev, users: [] }));
			}
		} finally {
			if (state.mounted) {
				setState(prev => ({ ...prev, loading: false }));
			}
		}
	}, [userId, state.mounted, isFollowersTab]);

	// Fetch users when component mounts or when userId/tab changes
	useEffect(() => {
		if (visible && state.mounted) {
			fetchUsers();
		}
	}, [visible, state.mounted, fetchUsers]);

	const handleFollowChange = useCallback((
		userId: string,
		isFollowing: boolean,
		updatedCount?: number
	) => {
		console.log(
			`User ${userId} follow status changed to: ${isFollowing}`
		);
		// Could update local state here if needed
	}, []);

	const handleProfilePress = useCallback((username: string) => {
		if (isClosingRef.current || preventAutoCloseRef.current) {
			console.log("Profile press ignored - modal is closing or in protected state");
			return;
		}

		console.log("Navigating to profile:", username);
		router.push(`/profile/${username}`);
	}, [router]);

	return {
		state,
		currentUser,
		isFollowersTab,
		isClosingRef,
		preventAutoCloseRef,
		handleFollowChange,
		handleProfilePress,
		fetchUsers,
	};
}; 