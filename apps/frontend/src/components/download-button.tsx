import React from "react";
import Link, { type LinkProps } from "next/link";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import { urls } from "~/urls";

import { AppleIcon, GooglePlayIcon, MetaIcon, MicrosoftIcon } from "./icons";

export const platforms = {
	apple: {
		href: urls.apps.apple,
		Icon: AppleIcon
	},
	google: {
		href: urls.apps.google,
		Icon: GooglePlayIcon
	},
	microsoft: {
		href: urls.apps.microsoft,
		Icon: MicrosoftIcon
	},
	side_quest: {
		href: urls.apps.sideQuest,
		Icon: MetaIcon
	}
};

export type DownloadPlatform = keyof typeof platforms;

export type DownloadButtonProps = Omit<LinkProps, "href"> & {
	platform: DownloadPlatform;
	className?: string;
};

export const DownloadButton: React.FC<DownloadButtonProps> = ({
	platform,
	className,
	...props
}) => {
	const t = useTranslations("download");
	const { href, Icon } = platforms[platform];

	return (
		<Link
			{...props}
			className={twMerge(
				"flex w-56 select-none items-center gap-4 rounded-xl bg-white-10 px-6 py-4 text-black-70 shadow-brand-1",
				className
			)}
			target="_blank"
			href={href}
		>
			<Icon className="h-8" />
			<div className="flex flex-col justify-center text-left">
				<span className="font-montserrat text-xs font-bold uppercase">
					{t("best_topical_mayfly_tap")}
				</span>
				<span className="font-nunito">{t(`platform.${platform}`)}</span>
			</div>
		</Link>
	);
};