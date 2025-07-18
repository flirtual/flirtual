import * as Sentry from "@sentry/react";
import { LazyMotion } from "motion/react";
import { type PropsWithChildren, startTransition, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSSR as useTranslateSSR } from "react-i18next";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useNavigate,
	useParams,
	useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { AnalyticsProvider } from "./analytics";
import { HavingIssues } from "./components/error";
import { InsetPreview } from "./components/inset-preview";
import { LoadingIndicator } from "./components/loading-indicator";
import { TooltipProvider } from "./components/tooltip";
import { UpdateInformation } from "./components/update-information";
import { environment } from "./const";
import { ToastProvider } from "./hooks/use-toast";
import { defaultLocale, i18n, locales } from "./i18n";
import { QueryProvider } from "./query";
import { RedirectBoundary } from "./redirect";

import "@fontsource-variable/montserrat";
import "@fontsource-variable/nunito";
import "./app/index.css";

export const links: Route.LinksFunction = () => [];

export async function loader({ params: { locale = defaultLocale } }: Route.LoaderArgs) {
	if (!locales.includes(locale)) locale = defaultLocale;
	await i18n.changeLanguage(locale);

	return { initialI18nStore: i18n.store.data };
}

export function Layout({ children }: PropsWithChildren) {
	let { locale = defaultLocale } = useParams();
	if (!locales.includes(locale)) locale = defaultLocale;

	const { initialI18nStore = {} } = useRouteLoaderData<typeof loader>("root") || {};

	useTranslateSSR(initialI18nStore, locale);
	useEffect(() => void i18n.changeLanguage(locale), [locale]);

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
					<AnalyticsProvider />
					<LazyMotion strict features={async () => ((await import("./motion")).default)}>
						<QueryProvider>
							{environment === "development" && <InsetPreview />}
							<UpdateInformation />
							<ToastProvider>
								<TooltipProvider>
									<RedirectBoundary>
										{children}
									</RedirectBoundary>
								</TooltipProvider>
							</ToastProvider>
						</QueryProvider>
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
