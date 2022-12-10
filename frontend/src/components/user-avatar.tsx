import React from "react";
import { twMerge } from "tailwind-merge";

import { User } from "~/api/user/user";
import { urls } from "~/urls";

export type UserAvatarProps = Omit<React.ComponentProps<"img">, "src"> & { user: User };

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, ...props }) => {
	return (
		<img
			{...props}
			className={twMerge("aspect-square shrink-0 rounded-full object-cover", props.className)}
			src={urls.userAvatar(user)}
		/>
	);
};
