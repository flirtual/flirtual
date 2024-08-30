import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import * as Sentry from "@sentry/nextjs";
import { twMerge } from "tailwind-merge";
import NextTopLoader from "@kfarwell/nextjs-toploader";
import { userAgentFromString } from "next/server";
import { headers } from "next/headers";

import { siteOrigin } from "~/const";
import { withOptionalSession } from "~/server-utilities";
import { urls } from "~/urls";
import { resolveTheme } from "~/theme";
import { ToastProvider } from "~/hooks/use-toast";
import { SessionProvider } from "~/components/session-provider";
import SafariPinnedTabImage from "~/../public/safari-pinned-tab.svg";
import { ShepherdProvider } from "~/components/shepherd";
import { ThemeProvider } from "~/hooks/use-theme";
import { type DevicePlatform, DeviceProvider } from "~/hooks/use-device";
import { NotificationProvider } from "~/hooks/use-notifications";
import { TooltipProvider } from "~/components/tooltip";
import AppUrlListener from "~/components/app-url-listener";
import NativeStartup from "~/components/native-startup";
import { PurchaseProvider } from "~/hooks/use-purchase";
import { InsetPreview } from "~/components/inset-preview";
import { getInternationalization } from "~/i18n";

import { ClientScripts } from "./client-scripts";
import { fontClassNames } from "./fonts";

import type { Metadata, Viewport } from "next";

import "~/css/index.scss";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("meta");

	return {
		metadataBase: new URL(siteOrigin),
		title: {
			template: t("title"),
			default: t("name")
		},
		description: t("knotty_direct_mongoose_bend"),
		manifest: "/manifest.json",
		applicationName: t("name"),
		appleWebApp: {
			title: t("name")
		},
		other: {
			"msapplication-TileColor": "#e9658b"
		},
		twitter: {
			site: `@${urls.socials.twitter.split("twitter.com/")[1]}`,
			card: "summary"
		},
		openGraph: {
			type: "website",
			title: t("name"),
			description: t("green_plain_mongoose_lend")
		},
		appLinks: {
			ios: {
				app_store_id: "6450485324",
				url: urls.apps.apple
			},
			android: {
				package: "zone.homie.flirtual.pwa",
				url: urls.apps.google
			},
			web: {
				url: siteOrigin,
				should_fallback: true
			}
		},
		itunes: {
			appId: "6450485324"
		}
	};
}

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#111111" }
	]
};

const platforms: Record<string, DevicePlatform> = {
	android: "android",
	ios: "apple",
	"mac os": "apple"
};

export default async function RootLayout({
	children
}: React.PropsWithChildren) {
	const session = await withOptionalSession().catch(() => null);

	const userAgent = userAgentFromString(headers().get("user-agent")!);

	const platform: DevicePlatform =
		platforms[userAgent.os.name?.toLowerCase() ?? ""] || "web";

	const native = userAgent.ua.includes("Flirtual-Native");
	Sentry.setTag("native", native ? "yes" : "no");

	const vision = userAgent.ua.includes("Flirtual-Vision");
	Sentry.setTag("vision", vision ? "yes" : "no");

	const theme = vision
		? "light"
		: (session?.user.preferences?.theme ?? "light");

	const locale = await getLocale();
	const { country } = await getInternationalization();

	const messages = await getMessages();

	return (
		<NextIntlClientProvider messages={messages}>
			<html
				suppressHydrationWarning
				data-native={native}
				data-platform={platform}
				data-theme={theme}
				data-vision={vision}
				data-country={country}
				lang={locale}
			>
				<head suppressHydrationWarning>
					<meta name="darkreader-lock" />
					<script
						data-cfasync="false"
						dangerouslySetInnerHTML={{
							__html: `
							(() => {
								const resolveTheme = ${resolveTheme.toString()}

								const url = new URL(location);
								const themeStyle = url.pathname === "/browse" && url.searchParams.get("kind") === "friend" ? "friend" : "love";
	
								Object.assign(document.documentElement.dataset, {
									theme: resolveTheme("${theme}"),
									themeStyle,
								});
						  })())
						`.trim()
						}}
					/>
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
					<DeviceProvider
						native={native}
						platform={platform}
						userAgent={userAgent}
						vision={vision}
						country={country}
					>
						<NativeStartup />
						<ToastProvider>
							{/* <Suspense fallback={<LoadingIndicatorScreen />}> */}
							<TooltipProvider>
								<SessionProvider session={session}>
									<NotificationProvider>
										<PurchaseProvider>
											<ThemeProvider>
												<ShepherdProvider>{children}</ShepherdProvider>
											</ThemeProvider>
										</PurchaseProvider>
									</NotificationProvider>
								</SessionProvider>
							</TooltipProvider>
							{/* </Suspense> */}
						</ToastProvider>
					</DeviceProvider>
				</body>
			</html>
		</NextIntlClientProvider>
	);
}
