import React from "react";
import { twMerge } from "tailwind-merge";

import { User } from "~/api/user/user";

export function getAvatarUrl(user: User): string {
	return `https://media.flirtu.al/${
		user.profile.images[0]?.externalId ?? "8212f93-af6f-4a2c-ac11-cb328bbc4aa4"
	}/`;
}

export type UserAvatarProps = Omit<React.ComponentProps<"img">, "src"> & { user: User };

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, ...props }) => {
	return (
		<img
			{...props}
			className={twMerge("aspect-square shrink-0 rounded-full object-cover", props.className)}
			src={getAvatarUrl(user)}
		/>
	);
};
