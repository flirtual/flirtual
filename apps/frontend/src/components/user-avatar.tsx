import React, { FC } from "react";
import { twMerge } from "tailwind-merge";

import { User, displayName } from "~/api/user/user";
import { urls } from "~/urls";

import { Image, ImageProps } from "./image";

export type UserAvatarProps = Omit<ImageProps, "src" | "alt"> & { user: User };

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, ...props }) => {
	return (
		<UserImage
			{...props}
			alt={`${displayName(user)}'s avatar`}
			draggable={false}
			src={urls.userAvatar(user)}
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
			width={32}
		/>
	);
};

export type UserImageProps = Omit<ImageProps, "src"> & { src: string };

export const UserImage: React.FC<UserImageProps> = ({
	options,
	src,
	...props
}) => {
	return (
		<Image
			{...props}
			className={twMerge("aspect-square shrink-0 select-none", props.className)}
			src={src}
			options={{
				scale_crop: [`1980x1980`, "smart_faces_points"],
				...options
			}}
		/>
	);
};
