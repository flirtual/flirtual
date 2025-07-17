import * as Sentry from "@sentry/react";
import { LazyMotion } from "motion/react";
import type { PropsWithChildren } from "react";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { HavingIssues } from "./components/error";
import { LoadingIndicator } from "./components/loading-indicator";

import "@fontsource-variable/montserrat";
import "@fontsource-variable/nunito";
import "./app/index.css";

export const links: Route.LinksFunction = () => [];

export async function loader({ params: { locale } }: Route.LoaderArgs) {
	return { locale };
}

export function Layout({ children }: PropsWithChildren) {
	const { locale } = useLoaderData<typeof loader>();
	// i18n.language = locale;

	return (
		<html suppressHydrationWarning lang={locale}>
			<head>
				<meta charSet="utf-8" />
				<meta content="width=device-width, initial-scale=1" name="viewport" />
				<Meta />
				<Links />
			</head>
			<body
				suppressHydrationWarning
				className="flex min-h-screen flex-col bg-white-20 font-nunito text-black-80 antialiased data-[theme=dark]:bg-black-70 data-[vision]:bg-transparent data-[theme=dark]:text-white-20 desktop:bg-cream desktop:data-[theme=dark]:bg-black-80"
			>
				<Sentry.ErrorBoundary
					fallback={({ eventId }) => (
						<div className="flex h-screen w-screen items-center justify-center">
							<HavingIssues digest={eventId} />
						</div>
					)}
				>
					<LazyMotion strict features={async () => ((await import("./motion")).default)}>
						{children}
					</LazyMotion>
				</Sentry.ErrorBoundary>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export function HydrateFallback() {
	return <LoadingIndicator />;
}

export default function App() {
	return <Outlet />;
}
