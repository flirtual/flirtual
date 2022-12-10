import { Montserrat, Nunito } from "@next/font/google";
import { twMerge } from "tailwind-merge";

import "~/css/index.css";

import { api } from "~/api";
import { useServerAuthenticate } from "~/server-utilities";
import { SsrUserProvider } from "~/components/ssr-user-provider";
import { urls } from "~/urls";

import { ClientScripts } from "./client-scripts";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export default async function RootLayout({ children }: React.PropsWithChildren) {
	const user = await useServerAuthenticate({ optional: true });

	return (
		<html lang="en">
			<head>
				<title>Flirtual</title>
				<meta
					content="Meet new people in Virtual Reality! Flirtual helps you go on dates in VR and VRChat. Formerly VRLFP."
					name="description"
				/>
				<link href="/images/apple-touch-icon.png" rel="apple-touch-icon" sizes="180x180" />
				<link href="/images/favicon-32x32.png" rel="icon" sizes="32x32" type="image/png" />
				<link href="/images/favicon-16x16.png" rel="icon" sizes="16x16" type="image/png" />
				<link href="/site.webmanifest" rel="manifest" />
				<link color="#e9658b" href="/images/safari-pinned-tab.svg" rel="mask-icon" />
				<link href="/favicon.ico" rel="shortcut icon" />
				<meta content="Flirtual" name="apple-mobile-web-app-title" />
				<meta content="Flirtual" name="application-name" />
				<meta content="#e9658b" name="msapplication-TileColor" />
				<meta content="#e9658b" name="theme-color" />
				<meta content="text/html; charset=utf-8" httpEquiv="content-type" />
				<meta
					content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"
					name="viewport"
				/>
				<meta content={`@${urls.socials.twitter().split("twitter.com/")[1]}`} name="twitter:site" />
				<meta content="website" property="og:type" />
				<meta content="Flirtual" property="og:title" />
				<meta
					content="The first and largest VR dating app. Join thousands for dates in VR apps like VRChat."
					property="og:description"
				/>
				<meta content="https://flirtu.al/images/android-chrome-512x512.png" property="og:image" />
				<meta content="512" property="og:image:width" />
				<meta content="512" property="og:image:width" />
				<meta content="summary" name="twitter:card" />
				{user && (
					<>
						<link as="image" href={urls.userAvatar(user)} rel="preload" />
						<link as="fetch" href={api.newUrl("auth/user").href} rel="preload" />
					</>
				)}
				<ClientScripts />
			</head>
			<body className={twMerge(montserrat.variable, nunito.variable)}>
				{/* @ts-expect-error: Server Component */}
				<SsrUserProvider optional>{children}</SsrUserProvider>
			</body>
		</html>
	);
}
