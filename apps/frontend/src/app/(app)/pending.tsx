"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { urls } from "~/urls";

export function LoadingPulsate() {
	const t = useTranslations();

	return (
		<div className="flex min-h-screen w-full items-center justify-center opacity-75">
			<Image
				priority
				alt={t("meta.name")}
				className="hidden w-1/2 max-w-lg animate-pulse dark:block desktop:block"
				height={1000}
				src={urls.media("flirtual-white.svg", "files")}
				width={3468}
			/>
			<Image
				priority
				alt={t("meta.name")}
				className="block w-1/2 max-w-lg animate-pulse dark:hidden desktop:hidden"
				height={1000}
				src={urls.media("flirtual-black.svg", "files")}
				width={3468}
			/>
		</div>
	);
}
