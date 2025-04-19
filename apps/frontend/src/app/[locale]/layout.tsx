import NextTopLoader from "@kfarwell/nextjs-toploader";
import type { Metadata, Viewport } from "next";
import type { Locale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { preconnect } from "react-dom";
import { twMerge } from "tailwind-merge";

import SafariPinnedTabImage from "~/../public/safari-pinned-tab.svg";
import { AnalyticsProvider } from "~/components/analytics";
import { InsetPreview } from "~/components/inset-preview";
import { TooltipProvider } from "~/components/tooltip";
import { UpdateInformation } from "~/components/update-information";
import { apiOrigin, environment, platformOverride, siteOrigin } from "~/const";
import { ToastProvider } from "~/hooks/use-toast";
import { locales } from "~/i18n/routing";
import { resolveTheme } from "~/theme";
import { imageOrigins, urls } from "~/urls";

import { fontClassNames } from "../fonts";
import { LoadingIndicator } from "./(app)/loading-indicator";
import { StagingBanner } from "./staging-banner";

import "../index.css";

export const dynamic = "error";

// eslint-disable-next-line unicorn/prevent-abbreviations
export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	const appName = t("flirtual");

	return {
		metadataBase: new URL(siteOrigin),
		title: {
			default: appName,
			template: t("page_title")
		},
		applicationName: appName,
		description: t("knotty_direct_mongoose_bend"),
		category: "technology",
		appLinks: {
			android: {
				package: "zone.homie.flirtual.pwa",
				url: urls.apps.google
			},
			ios: {
				app_store_id: "6450485324",
				url: urls.apps.apple
			},
			web: {
				should_fallback: true,
				url: siteOrigin
			}
		},
		appleWebApp: {
			title: appName,
		},
		itunes: {
			appId: "6450485324"
		},
		manifest: "/manifest.json",
		openGraph: {
			description: t("green_plain_mongoose_lend"),
			title: appName,
			type: "website"
		},
		twitter: {
			card: "summary",
			site: `@${urls.socials.twitter.split("twitter.com/")[1]}`
		},
		other: {
			"msapplication-TileColor": "#e9658b"
		},
	};
}

export const viewport: Viewport = {
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: [
		{ color: "#ffffff", media: "(prefers-color-scheme: light)" },
		{ color: "#111111", media: "(prefers-color-scheme: dark)" }
	],
	viewportFit: "cover",
	width: "device-width"
};

export default async function LocaleLayout({
	children,
	params
}: React.PropsWithChildren<{ params: Promise<{ locale: Locale }> }>) {
	const { locale } = await params;
	setRequestLocale(locale);

	preconnect(apiOrigin);
	imageOrigins.map((origin) => preconnect(origin));

	const messages = await getMessages();

	return (
		<NextIntlClientProvider messages={messages}>
			<AnalyticsProvider>
				<html
					suppressHydrationWarning
					data-platform={platformOverride || undefined}
					lang={locale}
				>
					<head>
						<meta name="darkreader-lock" />
						<link
							color="#e9658b"
							href={SafariPinnedTabImage.src}
							rel="mask-icon"
						/>
						<script>
							{`const theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
Object.assign(document.documentElement.dataset, { theme });`}
						</script>
					</head>
					<body className={twMerge(fontClassNames, "bg-white-20 font-nunito text-black-80 antialiased vision:bg-transparent dark:bg-black-70 dark:text-white-20 desktop:bg-cream desktop:dark:bg-black-80")}>
						<NextTopLoader
							color={["#FF8975", "#E9658B"]}
							height={5}
							showSpinner={false}
						/>
						<Suspense fallback={<LoadingIndicator />}>
							{environment === "preview" && <StagingBanner />}
							{environment === "development" && <InsetPreview />}
							<UpdateInformation />
							<ToastProvider>
								<TooltipProvider>
									{children}
								</TooltipProvider>
							</ToastProvider>
						</Suspense>
					</body>
				</html>
			</AnalyticsProvider>
		</NextIntlClientProvider>
	);
}
