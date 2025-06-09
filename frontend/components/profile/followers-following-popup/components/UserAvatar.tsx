import React from "react";
import { Image } from "react-native";
import DefaultAvatar from "../../../DefaultAvatar";
import { UserAvatarProps } from "../types";

export const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
	if (user.avatar_url) {
		return (
			<Image
				source={{ uri: user.avatar_url }}
				style={{
					width: 48,
					height: 48,
					borderRadius: 24,
				}}
				resizeMode="cover"
			/>
		);
	}

	return <DefaultAvatar userId={user.id} size={48} />;
};
