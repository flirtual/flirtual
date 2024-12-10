import NextTopLoader from "@kfarwell/nextjs-toploader";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Montserrat, Nunito } from "next/font/google";
import { headers as getHeaders } from "next/headers";
import { userAgentFromString } from "next/server";
import { preconnect } from "react-dom";
import { twMerge } from "tailwind-merge";

import SafariPinnedTabImage from "~/../public/safari-pinned-tab.svg";
import { Authentication } from "~/api/auth";
import { type PreferenceTheme, PreferenceThemes } from "~/api/user/preferences";
import { AnalyticsProvider } from "~/components/analytics";
import AppUrlListener from "~/components/app-url-listener";
import { InsetPreview } from "~/components/inset-preview";
import NativeStartup from "~/components/native-startup";
import { SessionProvider } from "~/components/session-provider";
import { TooltipProvider } from "~/components/tooltip";
import { apiOrigin, environment, siteOrigin } from "~/const";
import type { DeviceContext, DevicePlatform } from "~/hooks/use-device";
import { DeviceProvider } from "~/hooks/use-device";
import { InternationalizationProvider } from "~/hooks/use-internationalization";
import { ThemeProvider } from "~/hooks/use-theme";
import { ToastProvider } from "~/hooks/use-toast";
import { getInternationalization, supportedLanguages } from "~/i18n";
import { resolveTheme } from "~/theme";
import { imageOrigins, urls } from "~/urls";

import { StagingBanner } from "./staging-banner";

import "~/css/index.css";

export async function generateMetadata(): Promise<Metadata> {
	const [t, { locale: { current } }] = await Promise.all([getTranslations("meta"), getInternationalization()]);

	const appName = t("name");

	const canonical = new URL("/", siteOrigin);
	canonical.searchParams.set("language", current);

	return {
		title: {
			default: appName,
			template: t("title")
		},
		applicationName: appName,
		description: t("knotty_direct_mongoose_bend"),
		category: "technology",
		alternates: {
			canonical,
			languages: Object.fromEntries([...supportedLanguages, "x-default"].map((language) => {
				const url = new URL("/", siteOrigin);

				if (language !== "x-default")
					url.searchParams.set("language", language);

				return [language, url];
			}))
		},
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
		metadataBase: new URL(siteOrigin),
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

const platforms: Record<string, DevicePlatform> = {
	android: "android",
	ios: "apple",
	"mac os": "apple"
};

const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"]
});
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

const fontClassNames = twMerge(montserrat.variable, nunito.variable);

function getDevice(headers: Headers): DeviceContext {
	const userAgent = userAgentFromString(headers.get("user-agent")!);
	const { os, ua } = userAgent;

	const platform: DevicePlatform
		= platforms[os.name?.toLowerCase() ?? ""] || "web";

	const native = ua.includes("Flirtual-Native");
	const vision = ua.includes("Flirtual-Vision");

	return { native, platform, userAgent, vision };
}

export default async function RootLayout({
	children
}: React.PropsWithChildren) {
	preconnect(apiOrigin);
	imageOrigins.map((origin) => preconnect(origin));

	const session = await Authentication.getOptionalSession();

	const headers = await getHeaders();
	const device = getDevice(headers);

	let themeOverride = headers.get("theme") as PreferenceTheme | null;
	if (themeOverride && !PreferenceThemes.includes(themeOverride))
		themeOverride = null;

	const theme
		= themeOverride
		|| (device.vision ? "light" : (session?.user.preferences?.theme ?? "light"));

	const internationalization = await getInternationalization();
	const messages = await getMessages();

	return (
		<NextIntlClientProvider messages={messages}>
			<InternationalizationProvider messages={messages} value={internationalization}>
				<DeviceProvider {...device}>
					<SessionProvider session={session}>
						<ThemeProvider theme={theme}>
							<html suppressHydrationWarning>
								<head suppressHydrationWarning>
									<meta name="darkreader-lock" />
									{theme === "system" && (
									// eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
										<script
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
									<AppUrlListener />
								</head>
								<body className={fontClassNames}>
									{environment === "preview" && <StagingBanner />}
									<InsetPreview />
									<NextTopLoader
										color={["#FF8975", "#E9658B"]}
										height={5}
										showSpinner={false}
									/>
									<AnalyticsProvider>
										<NativeStartup />
										<ToastProvider>
											{/* <Suspense fallback={<LoadingIndicatorScreen />}> */}
											<TooltipProvider>{children}</TooltipProvider>
											{/* </Suspense> */}
										</ToastProvider>
									</AnalyticsProvider>
								</body>
							</html>
						</ThemeProvider>
					</SessionProvider>
				</DeviceProvider>
			</InternationalizationProvider>
		</NextIntlClientProvider>
	);
}
