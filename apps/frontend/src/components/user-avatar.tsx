import React, { FC } from "react";
import { twMerge } from "tailwind-merge";

import { User, displayName } from "~/api/user/user";
import { urls } from "~/urls";

import { Image, ImageProps } from "./image";

export type UserAvatarProps = Omit<ImageProps, "src" | "alt"> & {
	user: User;
	variant?: string;
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
	user,
	variant = "profile",
	...props
}) => {
	return (
		<UserImage
			{...props}
			alt={`${displayName(user)}'s avatar`}
			draggable={false}
			src={urls.userAvatar(user, variant)}
		/>
	);
};

export type UserThumbnailProps = Omit<UserAvatarProps, "width" | "height">;

export const UserThumbnail: FC<UserThumbnailProps> = (props) => {
	return (
		<UserAvatar
			{...props}
			className={twMerge("rounded-xl", props.className)}
			height={32}
			variant="icon"
			width={32}
		/>
	);
};

export type UserImageProps = Omit<ImageProps, "src"> & { src: string };

export const UserImage: React.FC<UserImageProps> = ({ src, ...props }) => {
	return (
		<Image
			{...props}
			src={src}
			className={twMerge(
				"aspect-square shrink-0 select-none object-cover",
				props.className
			)}
		/>
	);
};
