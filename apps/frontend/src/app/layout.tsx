import * as Sentry from "@sentry/nextjs";
import { Montserrat, Nunito } from "next/font/google";
import { twMerge } from "tailwind-merge";
import { Metadata } from "next";
import { Suspense } from "react";
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
import { LoadingIndicatorScreen } from "~/components/loading-indicator-screen";
import { ThemeProvider } from "~/hooks/use-theme";
import { DevicePlatform, DeviceProvider } from "~/hooks/use-device";
import { NotificationProvider } from "~/hooks/use-notifications";
import { TooltipProvider } from "~/components/tooltip";

import { ClientScripts } from "./client-scripts";

import "~/css/index.scss";
import AppUrlListener from "~/components/app-url-listener";

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
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#111111" }
	],
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
		android: {
			package: "zone.homie.flirtual.pwa",
			url: urls.apps.android
		},
		web: {
			url: siteOrigin,
			should_fallback: true
		}
	}
};

export default async function RootLayout({
	children
}: React.PropsWithChildren) {
	const session = await withOptionalSession();
	const theme = session?.user.preferences?.theme ?? "light";

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const userAgent = userAgentFromString(headers().get("user-agent")!);

	let platform = (userAgent.os.name?.toLowerCase() ?? "web") as DevicePlatform;
	if (!["android", "ios"].includes(platform)) platform = "web";

	const native = userAgent.ua.includes("Flirtual-Native");
	Sentry.setTag("native", native ? "yes" : "no");

	return (
		<html
			suppressHydrationWarning
			data-native={native}
			data-platform={platform}
			data-theme={theme}
			lang="en"
		>
			<head suppressHydrationWarning>
				<meta name="darkreader-lock" />
				<script
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
			</head>
			<body
				className={twMerge(
					montserrat.variable,
					nunito.variable,
					"overscroll-none"
				)}
			>
				<NextTopLoader
					color={["#FF8975", "#E9658B"]}
					height={5}
					showSpinner={false}
				/>
				<Suspense fallback={<LoadingIndicatorScreen />}>
					<AppUrlListener />
					<DeviceProvider
						native={native}
						platform={platform}
						userAgent={userAgent}
					>
						<ToastProvider>
							<TooltipProvider>
								<NotificationProvider>
									<SessionProvider session={session}>
										<ThemeProvider>
											<ShepherdProvider>{children}</ShepherdProvider>
										</ThemeProvider>
									</SessionProvider>
								</NotificationProvider>
							</TooltipProvider>
						</ToastProvider>
					</DeviceProvider>
				</Suspense>
			</body>
		</html>
	);
}
