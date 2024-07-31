import * as Sentry from "@sentry/nextjs";
import { Montserrat, Nunito } from "next/font/google";
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

import { ClientScripts } from "./client-scripts";

import type { Metadata, Viewport } from "next";

import "~/css/index.scss";

const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"]
});
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
	metadataBase: new URL(siteOrigin),
	title: {
		template: "%s - Flirtual",
		default: "Flirtual"
	},
	description:
		"Meet new people in Virtual Reality! Flirtual helps you go on dates in VR and VRChat.",
	manifest: "/manifest.json",
	applicationName: "Flirtual",
	appleWebApp: {
		title: "Flirtual"
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
		title: "Flirtual",
		description:
			"The first VR dating app. Join thousands for dates in VR apps like VRChat."
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
	const session = await withOptionalSession();

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

	return (
		<html
			suppressHydrationWarning
			data-native={native}
			data-platform={platform}
			data-theme={theme}
			data-vision={vision}
			lang="en"
		>
			<head suppressHydrationWarning>
				<meta name="darkreader-lock" />
				<script
					data-cfasync="false"
					dangerouslySetInnerHTML={{
						__html: `
							${resolveTheme.toString()}

							const url = new URL(location);
							const themeStyle = url.pathname === "/browse" && url.searchParams.get("kind") === "friend" ? "friend" : "love";

							Object.assign(document.documentElement.dataset, {
								theme: resolveTheme("${theme}"),
								themeStyle,
							});
						`.trim()
					}}
				/>
				<link color="#e9658b" href={SafariPinnedTabImage.src} rel="mask-icon" />
				<ClientScripts />
				<AppUrlListener />
			</head>
			<body
				className={twMerge(
					montserrat.variable,
					nunito.variable,
					"overscroll-none"
				)}
			>
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
				>
					<NativeStartup />
					<ToastProvider>
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
					</ToastProvider>
				</DeviceProvider>
			</body>
		</html>
	);
}
