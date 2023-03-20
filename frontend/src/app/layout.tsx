import { Montserrat, Nunito } from "next/font/google";
import { twMerge } from "tailwind-merge";
import { Metadata } from "next";

import { api } from "~/api";
import { useServerAuthenticate } from "~/server-utilities";
import { urls } from "~/urls";
import { SessionProvider } from "~/components/session-provider";

import { ClientScripts } from "./client-scripts";

import "~/css/index.css";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: "Flirtual",
		description:
			"Meet new people in Virtual Reality! Flirtual helps you go on dates in VR and VRChat. Formerly VRLFP.",
		manifest: "/site.webmanifest",
		applicationName: "Flirtual",
		appleWebApp: {
			title: "Flirtual"
		},
		themeColor: "#e9658b",
		viewport: "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1",
		twitter: {
			site: `@${urls.socials.twitter.split("twitter.com/")[1]}`,
			card: "summary"
		},
		openGraph: {
			type: "website",
			title: "Flirtual",
			description:
				"The first and largest VR dating app. Join thousands for dates in VR apps like VRChat.",
			images: {
				url: "https://flirtu.al/images/android-chrome-512x512.png",
				width: 512,
				height: 512
			}
		},
		icons: {
			shortcut: {
				url: "/favicon.ico"
			},
			apple: {
				url: "/images/apple-touch-icon.png",
				sizes: "180x180"
			},
			icon: [
				{
					url: "/images/favicon-32x32.png",
					type: "image/png",
					sizes: "32x32"
				},
				{
					url: "/images/favicon-16x16.png",
					type: "image/png",
					sizes: "16x16"
				}
			]
		}
	};
}

export default async function RootLayout({ children }: React.PropsWithChildren) {
	const session = await useServerAuthenticate({ optional: true });

	const theme = session?.user.preferences?.theme ?? "system";

	return (
		<html className={theme} lang="en">
			<head>
				{session && (
					<>
						<link as="image" href={urls.userAvatar(session.user)} rel="preload" />
						<link as="fetch" href={api.newUrl("auth/session").href} rel="preload" />
					</>
				)}
				<ClientScripts />
			</head>
			<body className={twMerge(montserrat.variable, nunito.variable)}>
				{/* @ts-expect-error: Server Component */}
				<SessionProvider optional>{children}</SessionProvider>
			</body>
		</html>
	);
}
