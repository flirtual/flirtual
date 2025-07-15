import type React from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Link, type LinkProps } from "~/components/link";
import { urls } from "~/urls";

import { AppleIcon, GooglePlayIcon, MetaIcon, MicrosoftIcon } from "./icons";

const platforms = {
	app_store: {
		href: urls.apps.apple,
		Icon: AppleIcon
	},
	google_play: {
		href: urls.apps.google,
		Icon: GooglePlayIcon
	},
	microsoft_store: {
		href: urls.apps.microsoft,
		Icon: MicrosoftIcon
	},
	sidequest: {
		href: urls.apps.sideQuest,
		Icon: MetaIcon
	}
};

export type DownloadPlatform = keyof typeof platforms;

export type DownloadButtonProps = {
	platform: DownloadPlatform;
	className?: string;
} & Omit<LinkProps, "href">;

export const DownloadButton: React.FC<DownloadButtonProps> = ({
	platform,
	className,
	...props
}) => {
	const { t } = useTranslation();
	const { href, Icon } = platforms[platform];

	return (
		<Link
			{...props}
			className={twMerge(
				"flex min-w-56 items-center gap-4 rounded-xl bg-white-10 px-6 py-4 text-black-70 shadow-brand-1",
				className
			)}
			href={href}
			target="_blank"
		>
			<Icon className="h-8" />
			<div className="flex flex-col justify-center text-left">
				<span className="font-montserrat text-xs font-bold uppercase">
					{t("download_on")}
					{" "}
				</span>
				<span className="font-nunito">{t(platform)}</span>
			</div>
		</Link>
	);
};
