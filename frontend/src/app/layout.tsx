import { Montserrat, Nunito } from "next/font/google";
import { twMerge } from "tailwind-merge";
import { Metadata } from "next";

import { api } from "~/api";
import { withOptionalSession } from "~/server-utilities";
import { siteOrigin, urls } from "~/urls";
import { resolveTheme } from "~/theme";
import { ToastProvider } from "~/hooks/use-toast";
import { SessionProvider } from "~/components/session-provider";

import { ClientScripts } from "./client-scripts";
import { HydrationBlock } from "./hydration-block";

import "~/css/index.css";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
	metadataBase: new URL(siteOrigin),
	title: {
		template: "%s - Flirtual",
		default: "Flirtual"
	},
	description:
		"Meet new people in Virtual Reality! Flirtual helps you go on dates in VR and VRChat. Formerly VRLFP.",
	manifest: "/manifest.json",
	applicationName: "Flirtual",
	appleWebApp: {
		title: "Flirtual"
	},
	themeColor: "#e9658b",
	twitter: {
		site: `@${urls.socials.twitter.split("twitter.com/")[1]}`,
		card: "summary"
	},
	openGraph: {
		type: "website",
		title: "Flirtual",
		description:
			"The first and largest VR dating app. Join thousands for dates in VR apps like VRChat."
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

export default async function RootLayout({ children }: React.PropsWithChildren) {
	const session = await withOptionalSession();
	const theme = session?.user.preferences?.theme ?? "system";

	return (
		<html suppressHydrationWarning className={theme} lang="en">
			<head>
				{theme === "system" && (
					<script
						dangerouslySetInnerHTML={{
							__html: `
								${resolveTheme.toString()}

								document.documentElement.classList.remove("system");
								document.documentElement.classList.add(resolveTheme());
							`.trim()
						}}
					/>
				)}
				<script
					dangerouslySetInnerHTML={{
						__html: `
								const url - new URL(location);
							  if (url.pathname === "/browse" && url.searchParams.get("kind") === "friend")
									document.documentElement.classList.add("friend-mode");
							`.trim()
					}}
				/>
				{session && (
					<>
						<link as="image" href={urls.userAvatar(session.user)} rel="preload" />
						<link
							as="fetch"
							crossOrigin="use-credentials"
							href={api.newUrl("auth/session").href}
							rel="preload"
						/>
					</>
				)}
				<ClientScripts />
			</head>
			<body className={twMerge(montserrat.variable, nunito.variable)}>
				<HydrationBlock />
				<SessionProvider session={session}>
					<ToastProvider>{children}</ToastProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
