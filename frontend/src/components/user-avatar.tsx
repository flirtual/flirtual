import React from "react";
import { twMerge } from "tailwind-merge";

import { User, displayName } from "~/api/user/user";
import { urls } from "~/urls";

import { Image, ImageProps } from "./image";

export type UserAvatarProps = Omit<ImageProps, "src" | "alt"> & { user: User };

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, ...props }) => {
	return <UserImage {...props} alt={`${displayName(user)}'s avatar`} src={urls.userAvatar(user)} />;
};

export type UserImageProps = Omit<ImageProps, "src"> & { src: string };

export const UserImage: React.FC<UserImageProps> = ({ options, src, ...props }) => {
	return (
		<Image
			{...props}
			className={twMerge("aspect-square shrink-0", props.className)}
			src={src}
			options={{
				scale_crop: [`1980x1980`, "smart_faces_points"],
				...options
			}}
		/>
	);
};
