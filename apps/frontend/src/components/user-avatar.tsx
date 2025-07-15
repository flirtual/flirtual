import type { FC } from "react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { displayName } from "~/api/user";
import { urls } from "~/urls";

import { Image, type ImageProps } from "./image";

export type UserAvatarProps = {
	user: Parameters<typeof displayName>[0] &
		Parameters<typeof urls.userAvatar>[0] | null;
	variant?: string;
} & Omit<ImageProps, "alt" | "src">;

export const UserAvatar: React.FC<UserAvatarProps> = ({
	user,
	variant = "profile",
	...props
}) => {
	const { t } = useTranslation();

	return (
		<UserImage
			{...props}
			alt={t("extra_moving_jackdaw_twist", {
				name: user
					? displayName(user)
					: t("anonymous")
			})}
			draggable={false}
			src={urls.userAvatar(user, variant)}
		/>
	);
};

export type UserThumbnailProps = Omit<UserAvatarProps, "height" | "width">;

export const UserThumbnail: FC<UserThumbnailProps> = ({ className, ...props }) => {
	return (
		<UserAvatar
			{...props}
			className={twMerge("rounded-xl", className)}
			height={32}
			variant="icon"
			width={32}
		/>
	);
};

export type UserImageProps = { src: string } & Omit<ImageProps, "src">;

export const UserImage: React.FC<UserImageProps> = ({ src, ...props }) => {
	return (
		<Image
			{...props}
			className={twMerge(
				"aspect-square shrink-0 object-cover",
				props.className
			)}
			src={src}
		/>
	);
};
