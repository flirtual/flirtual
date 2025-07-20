import * as Sentry from "@sentry/react";
import { LazyMotion } from "motion/react";
import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { preconnect } from "react-dom";
import { useSSR as useTranslateSSR } from "react-i18next";
import {
	Links,
	Meta,

	Outlet,
	Scripts,
	ScrollRestoration,
	useParams,
	useRouteLoaderData
} from "react-router";
import type { MetaDescriptor } from "react-router";
import { uniqueBy } from "remeda";

import type { Route } from "./+types/root";
import { AnalyticsProvider } from "./analytics";
import { HavingIssues } from "./components/error";
import { InsetPreview } from "./components/inset-preview";
import { LoadingIndicator } from "./components/loading-indicator";
import { TooltipProvider } from "./components/tooltip";
import { UpdateInformation } from "./components/update-information";
import { apiOrigin, development, platformOverride, production } from "./const";
import { ToastProvider } from "./hooks/use-toast";
import { defaultLocale, i18n, localePathnameRegex, locales } from "./i18n";
import { QueryProvider } from "./query";
import { RedirectBoundary } from "./redirect";
import { bucketOrigins, urls } from "./urls";

import "@fontsource-variable/montserrat";
import "@fontsource-variable/nunito";
import "./app/index.css";

export async function loader({ params: { locale = defaultLocale } }: Route.LoaderArgs) {
	if (!locales.includes(locale)) locale = defaultLocale;
	await i18n.changeLanguage(locale);

	return {
		initialI18nStore: {
			// Only include the locale that was requested, as during during pre-rendering
			// we load every locale. Without this, we'd bundle every locale into the
			// initial HTML, which is not what we want.
			[locale]: i18n.store.data[locale]
		},
		locale
	};
}

export function meta({ params: { locale = defaultLocale } }: Pick<Route.MetaArgs, "params">): Route.MetaDescriptors {
	const t = i18n.getFixedT(locale);

	return [
		{ title: t("flirtual") },
		{ name: "description", content: t("knotty_direct_mongoose_bend") },
		{ }
	];
}

// eslint-disable-next-line react-refresh/only-export-components
export { meta as rootMeta };

// eslint-disable-next-line react-refresh/only-export-components
export function metaMerge(metas: Array<MetaDescriptor>) {
	return uniqueBy(metas.reverse(), (meta, index) => {
		if ("title" in meta && meta.title) return "title";
		if ("name" in meta && meta.name) return `name:${meta.name}`;
		if ("property" in meta && meta.property) return `property:${meta.property}`;
		if ("httpEquiv" in meta && meta.httpEquiv) return `httpEquiv:${meta.httpEquiv}`;

		// Always unique.
		return index;
	});
}

export function Layout({ children }: PropsWithChildren) {
	let { locale = defaultLocale } = useParams();
	if (!locales.includes(locale)) locale = defaultLocale;

	const { initialI18nStore = {} } = useRouteLoaderData<typeof loader>("root") || {};

	useTranslateSSR(initialI18nStore, locale);
	useEffect(() => void i18n.changeLanguage(locale), [locale]);

	preconnect(apiOrigin);
	bucketOrigins.map((origin) => preconnect(origin));

	return (
		<html suppressHydrationWarning lang={locale}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
				<script src={`https://cdnjs.cloudflare.com/polyfill/v3/polyfill${production ? ".min" : ""}.js?features=${[
					"Intl",
					"Intl.Locale",
					"Intl.DateTimeFormat",
					`Intl.DateTimeFormat.~locale.${locale}`,
					`Intl.NumberFormat`,
					`Intl.NumberFormat.~locale.${locale}`,
					"Intl.PluralRules",
					`Intl.PluralRules.~locale.${locale}`,
					"Intl.RelativeTimeFormat",
					`Intl.RelativeTimeFormat.~locale.${locale}`,
					"Intl.ListFormat",
					`Intl.ListFormat.~locale.${locale}`
				].join(",")}`}
				/>
			</head>
			<body
				suppressHydrationWarning
				className="flex min-h-screen flex-col bg-white-20 font-nunito text-black-80 antialiased data-[theme=dark]:bg-black-70 data-[vision]:bg-transparent data-[theme=dark]:text-white-20 desktop:bg-cream desktop:data-[theme=dark]:bg-black-80"
				data-platform={platformOverride || undefined}
			>
				{/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
				<script dangerouslySetInnerHTML={{
					__html: `const localTheme = JSON.parse(localStorage.getItem(".theme") || \`"system"\`);
const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const theme = localTheme === "system" ? prefersDark : localTheme;
const themeStyle = location.pathname.replace(${localePathnameRegex}, "") === ${JSON.stringify(urls.discover("homies"))} ? "friend" : "default";

Object.assign(document.body.dataset, { theme, themeStyle });

const fontSize = JSON.parse(localStorage.getItem(".font_size") || "16") || 16;
document.documentElement.style.setProperty("font-size", fontSize + "px");`
				}}
				/>
				<Sentry.ErrorBoundary
					fallback={({ eventId }) => (
						<div className="flex h-screen w-screen items-center justify-center">
							<HavingIssues digest={eventId} />
						</div>
					)}
				>
					<RedirectBoundary>
						<AnalyticsProvider />
						<LazyMotion strict features={async () => ((await import("./motion")).default)}>
							<QueryProvider>
								{development && <InsetPreview />}
								<UpdateInformation />
								<ToastProvider>
									<TooltipProvider>
										{children}
									</TooltipProvider>
								</ToastProvider>
							</QueryProvider>
						</LazyMotion>
					</RedirectBoundary>
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
