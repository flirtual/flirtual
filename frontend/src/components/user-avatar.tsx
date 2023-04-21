import React from "react";
import { twMerge } from "tailwind-merge";

import { User, displayName } from "~/api/user/user";
import { urls } from "~/urls";

import { Image, ImageProps } from "./image";

export type UserAvatarProps = Omit<ImageProps, "src" | "alt"> & { user: User };

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, ...props }) => {
	return (
		<Image
			{...props}
			alt={`${displayName(user)}'s avatar`}
			className={twMerge("aspect-square shrink-0 object-cover", props.className)}
			src={urls.userAvatar(user)}
		/>
	);
};
