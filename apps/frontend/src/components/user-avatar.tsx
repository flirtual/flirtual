import type { FC } from "react";
import type React from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import type { User } from "~/api/user";
import { blurHashToDataUrl } from "~/blurhash";
import { urls } from "~/urls";

import { Image } from "./image";
import type { ImageProps } from "./image";

export type UserAvatarProps = {
	user: User | null;
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
					? user.profile.displayName || t("unnamed_user")
					: t("anonymous")
			})}
			blurHash={user?.profile?.images?.[0]?.blurHash}
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

export type UserImageProps = { src: string; blurHash?: string } & Omit<ImageProps, "src">;

export const UserImage: React.FC<UserImageProps> = ({ src, blurHash, ...props }) => {
	const [loaded, setLoaded] = useState(false);

	// Memoized so it decodes once per hash (not on every render) and frees with
	// the component. Undefined on the server (no canvas); the resulting mismatch
	// is harmless on this childless <img>, so it's suppressed below.
	const placeholder = useMemo(
		() => (blurHash ? blurHashToDataUrl(blurHash) : undefined),
		[blurHash]
	);
	const background = loaded ? undefined : placeholder;

	return (
		<Image
			{...props}
			suppressHydrationWarning
			className={twMerge(
				"aspect-square shrink-0 bg-cover bg-center bg-no-repeat object-cover text-transparent",
				props.className
			)}
			style={{
				backgroundImage: background ? `url(${background})` : "none",
				...props.style
			}}
			src={src}
			onLoad={(event) => {
				setLoaded(true);
				props.onLoad?.(event);
			}}
		/>
	);
};
