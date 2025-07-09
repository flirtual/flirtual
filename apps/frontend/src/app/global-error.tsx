"use client";

import type { Locale } from "next-intl";
import { twMerge } from "tailwind-merge";

import { Image } from "~/components/image";
import { maintenance } from "~/const";
import { useInterval } from "~/hooks/use-interval";
import { defaultLocale, guessLocale, locales } from "~/i18n/routing";
import { urls } from "~/urls";

import { fontClassNames } from "./fonts";

import "./index.css";

const translations = {
	en: {
		title: maintenance
			? "Flirtual is temporarily unavailable."
			: "It looks like we're having issues",
		subtitle: maintenance
			? "But we'll be right back—check back soon!"
			: undefined,
		reload: "Reload",
		discord: "Discord Community",
		contact: "Contact Support",
	},
	ja: {
		title: maintenance
			? "Firtualは定期メンテナンスのため一時的にオフラインになっています。"
			: "問題を抱えているようだ",
		subtitle: maintenance
			? "でも、またすぐに戻ってきますから、すぐにチェックしてください！"
			: undefined,
		reload: "リロード",
		discord: "Discordコミュニティ",
		contact: "サポートに連絡",
	},
} as const;

export default function GlobalError() {
	// NextIntlClientProvider is not available here, so we need to manually determine
	// the locale, then embed all translations in this file.

	const locale = guessLocale();
	const t = translations[locale];

	const reload = () => location.reload();

	// Automatic retry, as eventually, we'll be back online.
	useInterval(reload, "30s");

	return (
		<html>
			<body className={twMerge(fontClassNames, "flex min-h-screen grow flex-col items-center justify-center bg-white-20 p-4 text-center font-nunito text-black-80 vision:bg-transparent dark:bg-black-70 dark:text-white-20 desktop:flex-col desktop:bg-cream desktop:dark:bg-black-80")}>
				<div className="flex flex-col items-center">
					<Image
						priority
						alt=""
						className="pettable mx-auto mb-4 h-14 w-fit shrink-0 rotate-[10deg] desktop:mt-1 desktop:h-16"
						draggable={false}
						height={345}
						src={urls.media("b25d8377-7035-4a23-84f1-faa095fa8104")}
						width={412}
					/>
					<h1>{t.title}</h1>
					{t.subtitle && <h2 className="mb-2 text-sm">{t.subtitle}</h2>}
					<div className="flex flex-wrap gap-2 text-center text-xs">
						<span className="cursor-pointer text-theme-2" onClick={reload}>
							{t.reload}
						</span>
						{" ⋅ "}
						<a className="text-theme-2" href={urls.socials.discord}>
							{t.discord}
						</a>
						{" ⋅ "}
						<a className="text-theme-2" href={urls.resources.contact}>
							{t.contact}
						</a>
					</div>
				</div>
			</body>
		</html>
	);
}
