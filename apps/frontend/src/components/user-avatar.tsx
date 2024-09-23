import { twMerge } from "tailwind-merge";
import { useTranslations } from "next-intl";

import { displayName } from "~/api/user";
import { urls } from "~/urls";

import { Image, type ImageProps } from "./image";

import type { FC } from "react";
import type React from "react";

export type UserAvatarProps = Omit<ImageProps, "src" | "alt"> & {
	user: Parameters<typeof displayName>[0] &
		Parameters<typeof urls.userAvatar>[0];
	variant?: string;
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
	user,
	variant = "profile",
	...props
}) => {
	const t = useTranslations("profile");

	return (
		<UserImage
			{...props}
			alt={t("happy_yummy_otter_climb", { displayName: displayName(user) })}
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
