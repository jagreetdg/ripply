import { useState, useEffect, useRef, useCallback } from "react";
import { Animated, Platform } from "react-native";
import { getVoiceBio } from "../../../../services/api";
import { ProfileHeaderProps, ProfileHeaderState, VoiceBio } from "../types";

export const useProfileHeader = ({
	userId,
	avatarUrl,
	coverPhotoUrl,
}: Pick<ProfileHeaderProps, "userId" | "avatarUrl" | "coverPhotoUrl">) => {
	const [state, setState] = useState<ProfileHeaderState>({
		isVoiceBioPlaying: false,
		isExpanded: false,
		progress: 0,
		isSeeking: false,
		modalVisible: false,
		activePhoto: null,
		localAvatarUrl: avatarUrl || null,
		localCoverPhotoUrl: coverPhotoUrl || null,
		voiceBio: null,
		loadingVoiceBio: false,
	});

	const buttonWidth = useRef(new Animated.Value(32)).current;
	const progressInterval = useRef<NodeJS.Timeout | null>(null);
	const [wave1] = useState(new Animated.Value(0));
	const [wave2] = useState(new Animated.Value(0));
	const [wave3] = useState(new Animated.Value(0));
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const progressContainerRef = useRef<any>(null);

	// Sync local state with props
	useEffect(() => {
		setState(prev => ({
			...prev,
			localAvatarUrl: avatarUrl || null,
			localCoverPhotoUrl: coverPhotoUrl || null,
		}));
	}, [avatarUrl, coverPhotoUrl]);

	// Fetch voice bio data
	useEffect(() => {
		const fetchVoiceBio = async () => {
			if (!userId) return;

			try {
				setState(prev => ({ ...prev, loadingVoiceBio: true }));
				const data = await getVoiceBio(userId);
				setState(prev => ({ ...prev, voiceBio: data as VoiceBio | null }));
			} catch (error) {
				console.error("Error fetching voice bio:", error);
			} finally {
				setState(prev => ({ ...prev, loadingVoiceBio: false }));
			}
		};

		fetchVoiceBio();
	}, [userId]);

	const handleVoiceBioCollapse = useCallback(() => {
		setState(prev => ({
			...prev,
			isExpanded: false,
			isVoiceBioPlaying: false,
			progress: 0,
		}));

		if (progressInterval.current) {
			clearInterval(progressInterval.current);
			progressInterval.current = null;
		}

		// Stop audio playback if it's playing
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}

		Animated.spring(buttonWidth, {
			toValue: 32,
			useNativeDriver: false,
			friction: 8,
		}).start();
	}, [buttonWidth]);

	useEffect(() => {
		if (state.isVoiceBioPlaying && !state.isSeeking) {
			// If we have an actual audio element, use it for progress
			if (audioRef.current) {
				progressInterval.current = setInterval(() => {
					const currentTime = audioRef.current?.currentTime || 0;
					const duration = audioRef.current?.duration || 1;
					const newProgress = currentTime / duration;

					setState(prev => ({ ...prev, progress: newProgress }));

					if (newProgress >= 0.999) {
						handleVoiceBioCollapse();
					}
				}, 100);
			} else {
				// Fallback for native platforms
				progressInterval.current = setInterval(() => {
					setState(prev => {
						const newProgress = prev.progress + 0.01;
						if (newProgress >= 1) {
							handleVoiceBioCollapse();
							return prev;
						}
						return { ...prev, progress: newProgress };
					});
				}, 100);
			}
		} else {
			if (progressInterval.current) {
				clearInterval(progressInterval.current);
				progressInterval.current = null;
			}
		}

		return () => {
			if (progressInterval.current) {
				clearInterval(progressInterval.current);
			}
		};
	}, [state.isVoiceBioPlaying, state.isSeeking, handleVoiceBioCollapse]);

	const handleSeekStart = useCallback(() => {
		setState(prev => ({ ...prev, isSeeking: true }));
	}, []);

	const handleSeekEnd = useCallback(() => {
		setState(prev => ({ ...prev, isSeeking: false }));
	}, []);

	const handleSeek = useCallback((event: any) => {
		if (!progressContainerRef.current) return;

		// This is a simplified version - in a real implementation,
		// you'd calculate the exact position based on the touch/click coordinates
		const newProgress = 0.5; // Placeholder
		setState(prev => ({ ...prev, progress: newProgress }));

		if (audioRef.current) {
			audioRef.current.currentTime = newProgress * audioRef.current.duration;
		}
	}, []);

	const handlePhotoPress = useCallback((type: "profile" | "cover") => {
		setState(prev => ({ ...prev, activePhoto: type, modalVisible: true }));
	}, []);

	const handlePhotoUpdated = useCallback((
		type: "profile" | "cover",
		newUrl: string | null
	) => {
		if (type === "profile") {
			setState(prev => ({ ...prev, localAvatarUrl: newUrl }));
		} else {
			setState(prev => ({ ...prev, localCoverPhotoUrl: newUrl }));
		}
	}, []);

	const handleToggleVoiceBio = useCallback(() => {
		setState(prev => ({ ...prev, isVoiceBioPlaying: !prev.isVoiceBioPlaying }));

		if (!state.isVoiceBioPlaying) {
			// Audio is not playing, start it
			if (audioRef.current) {
				audioRef.current.play();
			}
		} else {
			// Audio is playing, pause it
			if (audioRef.current) {
				audioRef.current.pause();
			}
		}
	}, [state.isVoiceBioPlaying]);

	const handleExpandVoiceBio = useCallback(() => {
		setState(prev => ({ ...prev, isExpanded: true }));
	}, []);

	const closeModal = useCallback(() => {
		setState(prev => ({ ...prev, modalVisible: false, activePhoto: null }));
	}, []);

	return {
		state,
		audioRef,
		progressContainerRef,
		handleVoiceBioCollapse,
		handleSeekStart,
		handleSeekEnd,
		handleSeek,
		handlePhotoPress,
		handlePhotoUpdated,
		handleToggleVoiceBio,
		handleExpandVoiceBio,
		closeModal,
	};
}; 