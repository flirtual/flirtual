import { getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import * as Sentry from "@sentry/nextjs";
import { twMerge } from "tailwind-merge";
import NextTopLoader from "@kfarwell/nextjs-toploader";
import { userAgentFromString } from "next/server";
import { headers } from "next/headers";

import { ClientScripts } from "./client-scripts";
import { fontClassNames } from "./fonts";

import type { Metadata, Viewport } from "next";

import { siteOrigin } from "~/const";
import { urls } from "~/urls";
import { resolveTheme } from "~/theme";
import { ToastProvider } from "~/hooks/use-toast";
import { SessionProvider } from "~/components/session-provider";
import SafariPinnedTabImage from "~/../public/safari-pinned-tab.svg";
import { ThemeProvider } from "~/hooks/use-theme";
import { type DevicePlatform, DeviceProvider } from "~/hooks/use-device";
import { TooltipProvider } from "~/components/tooltip";
import AppUrlListener from "~/components/app-url-listener";
import NativeStartup from "~/components/native-startup";
import { InsetPreview } from "~/components/inset-preview";
import { getInternationalization } from "~/i18n";
import { InternationalizationProvider } from "~/hooks/use-internationalization";
import { PreferenceThemes, type PreferenceTheme } from "~/api/user/preferences";
import { Authentication } from "~/api/auth";

import "~/css/index.scss";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("meta");

	return {
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
			title: t("name")
		},
		applicationName: t("name"),
		description: t("knotty_direct_mongoose_bend"),
		itunes: {
			appId: "6450485324"
		},
		manifest: "/manifest.json",
		metadataBase: new URL(siteOrigin),
		openGraph: {
			description: t("green_plain_mongoose_lend"),
			title: t("name"),
			type: "website"
		},
		other: {
			"msapplication-TileColor": "#e9658b"
		},
		title: {
			default: t("name"),
			template: t("title")
		},
		twitter: {
			card: "summary",
			site: `@${urls.socials.twitter.split("twitter.com/")[1]}`
		}
	};
}

export const viewport: Viewport = {
	initialScale: 1,
	themeColor: [
		{ color: "#ffffff", media: "(prefers-color-scheme: light)" },
		{ color: "#111111", media: "(prefers-color-scheme: dark)" }
	],
	viewportFit: "cover",
	width: "device-width"
};

const platforms: Record<string, DevicePlatform> = {
	android: "android",
	ios: "apple",
	"mac os": "apple"
};

export default async function RootLayout({
	children
}: React.PropsWithChildren) {
	const session = await Authentication.getOptionalSession();

	const userAgent = userAgentFromString(headers().get("user-agent")!);

	const platform: DevicePlatform =
		platforms[userAgent.os.name?.toLowerCase() ?? ""] || "web";

	const native = userAgent.ua.includes("Flirtual-Native");
	Sentry.setTag("native", native ? "yes" : "no");

	const vision = userAgent.ua.includes("Flirtual-Vision");
	Sentry.setTag("vision", vision ? "yes" : "no");

	let themeOverride = headers().get("theme") as PreferenceTheme | null;
	if (themeOverride && !PreferenceThemes.includes(themeOverride))
		themeOverride = null;

	const theme =
		themeOverride ||
		(vision ? "light" : (session?.user.preferences?.theme ?? "light"));

	const internationalization = await getInternationalization();

	const messages = await getMessages();

	return (
		<NextIntlClientProvider messages={messages}>
			<InternationalizationProvider value={internationalization}>
				<DeviceProvider
					native={native}
					platform={platform}
					userAgent={userAgent}
					vision={vision}
				>
					<SessionProvider session={session}>
						<ThemeProvider theme={theme}>
							<html suppressHydrationWarning>
								<head suppressHydrationWarning>
									<meta name="darkreader-lock" />
									{theme === "system" && (
										<script
											data-cfasync="false"
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
									)}
									<link
										color="#e9658b"
										href={SafariPinnedTabImage.src}
										rel="mask-icon"
									/>
									<ClientScripts />
									<AppUrlListener />
								</head>
								<body className={twMerge(fontClassNames, "overscroll-none")}>
									<InsetPreview />
									<NextTopLoader
										color={["#FF8975", "#E9658B"]}
										height={5}
										showSpinner={false}
									/>
									<NativeStartup />
									<ToastProvider>
										{/* <Suspense fallback={<LoadingIndicatorScreen />}> */}
										<TooltipProvider>{children}</TooltipProvider>
										{/* </Suspense> */}
									</ToastProvider>
								</body>
							</html>
						</ThemeProvider>
					</SessionProvider>
				</DeviceProvider>
			</InternationalizationProvider>
		</NextIntlClientProvider>
	);
}
