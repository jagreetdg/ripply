import React, { useState, useCallback } from "react";
import { ConfirmationModal } from "../components/common/ConfirmationModal";
import { Feather } from "@expo/vector-icons";

interface ConfirmationOptions {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	confirmButtonColor?: string;
	isDestructive?: boolean;
	icon?: keyof typeof Feather.glyphMap;
}

interface ConfirmationState extends ConfirmationOptions {
	visible: boolean;
	onConfirm: (() => void) | null;
	onCancel: (() => void) | null;
}

export function useConfirmation() {
	const [confirmation, setConfirmation] = useState<ConfirmationState>({
		visible: false,
		title: "",
		message: "",
		onConfirm: null,
		onCancel: null,
	});

	const showConfirmation = useCallback(
		(options: ConfirmationOptions): Promise<boolean> => {
			return new Promise((resolve) => {
				setConfirmation({
					...options,
					visible: true,
					onConfirm: () => {
						setConfirmation((prev) => ({ ...prev, visible: false }));
						resolve(true);
					},
					onCancel: () => {
						setConfirmation((prev) => ({ ...prev, visible: false }));
						resolve(false);
					},
				});
			});
		},
		[]
	);

	const hideConfirmation = useCallback(() => {
		setConfirmation((prev) => ({ ...prev, visible: false }));
	}, []);

	const ConfirmationComponent = useCallback(() => {
		if (!confirmation.onConfirm || !confirmation.onCancel) {
			return null;
		}

		return (
			<ConfirmationModal
				visible={confirmation.visible}
				title={confirmation.title}
				message={confirmation.message}
				confirmText={confirmation.confirmText}
				cancelText={confirmation.cancelText}
				confirmButtonColor={confirmation.confirmButtonColor}
				isDestructive={confirmation.isDestructive}
				icon={confirmation.icon}
				onConfirm={confirmation.onConfirm}
				onCancel={confirmation.onCancel}
			/>
		);
	}, [confirmation]);

	return {
		showConfirmation,
		hideConfirmation,
		ConfirmationComponent,
	};
}

// Pre-defined confirmation types for common use cases
export const confirmationPresets = {
	delete: (itemName: string) => ({
		title: "Delete Item",
		message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
		confirmText: "Delete",
		cancelText: "Cancel",
		isDestructive: true,
		icon: "trash-2" as keyof typeof Feather.glyphMap,
	}),

	logout: () => ({
		title: "Sign Out",
		message: "Are you sure you want to sign out?",
		confirmText: "Sign Out",
		cancelText: "Cancel",
		isDestructive: true,
		icon: "log-out" as keyof typeof Feather.glyphMap,
	}),

	save: (itemName: string) => ({
		title: "Save Changes",
		message: `Do you want to save changes to ${itemName}?`,
		confirmText: "Save",
		cancelText: "Discard",
		isDestructive: false,
		icon: "save" as keyof typeof Feather.glyphMap,
	}),

	discard: () => ({
		title: "Discard Changes",
		message: "Are you sure you want to discard your changes?",
		confirmText: "Discard",
		cancelText: "Keep Editing",
		isDestructive: true,
		icon: "x-circle" as keyof typeof Feather.glyphMap,
	}),

	remove: (itemName: string) => ({
		title: "Remove Item",
		message: `Are you sure you want to remove ${itemName}?`,
		confirmText: "Remove",
		cancelText: "Cancel",
		isDestructive: true,
		icon: "minus-circle" as keyof typeof Feather.glyphMap,
	}),
};
