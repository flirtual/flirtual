import NextTopLoader from "@kfarwell/nextjs-toploader";
import type { Metadata, Viewport } from "next";
import type { Locale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { preconnect } from "react-dom";

import SafariPinnedTabImage from "~/../public/safari-pinned-tab.svg";
import { AnalyticsProvider } from "~/components/analytics";
import { InsetPreview } from "~/components/inset-preview";
import { NativeStartup } from "~/components/native-startup";
import { TooltipProvider } from "~/components/tooltip";
import { apiOrigin, environment, siteOrigin } from "~/const";
import { ToastProvider } from "~/hooks/use-toast";
import { locales } from "~/i18n/routing";
import { imageOrigins, urls } from "~/urls";

import { fontClassNames } from "../fonts";
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

export default async function RootLayout({
	children,
	params
}: React.PropsWithChildren<{ params: Promise<{ locale: Locale }> }>) {
	const { locale } = await params;
	setRequestLocale(locale);

	preconnect(apiOrigin);
	imageOrigins.map((origin) => preconnect(origin));

	// const theme = "light";
	//	= themeOverride
	//		|| (device.vision ? "light" : "light" /* (session?.user.preferences?.theme ?? "light") */);

	const messages = await getMessages();

	return (
		<html suppressHydrationWarning lang={locale}>
			<head>
				<meta name="darkreader-lock" />
				{/* {theme === "system" && (
					<script
						// eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
						dangerouslySetInnerHTML={{
							__html: `(() => {
  const resolveTheme = ${resolveTheme.toString()};

  const url = new URL(location);
  const themeStyle = url.pathname === "/browse" && url.searchParams.get("kind") === "friend" ? "friend" : "love";

  Object.assign(document.documentElement.dataset, {
    theme: resolveTheme("system"),
    themeStyle,
  });
})()
						`.trim()
						}}
					/>
				)} */}
				<link
					color="#e9658b"
					href={SafariPinnedTabImage.src}
					rel="mask-icon"
				/>
			</head>
			<body className={fontClassNames} data-theme="light">
				<NextTopLoader
					color={["#FF8975", "#E9658B"]}
					height={5}
					showSpinner={false}
				/>
				{/* <Suspense fallback={<LoadingIndicator />}> */}
				<NextIntlClientProvider messages={messages}>
					{environment === "preview" && <StagingBanner />}
					{environment === "development" && <InsetPreview />}
					<NativeStartup />
					<AnalyticsProvider>
						<ToastProvider>
							<TooltipProvider>
								{children}
							</TooltipProvider>
						</ToastProvider>
					</AnalyticsProvider>
				</NextIntlClientProvider>
				{/* </Suspense> */}
			</body>
		</html>
	);
}
