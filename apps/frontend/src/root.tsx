import * as Sentry from "@sentry/react";
import { LazyMotion } from "motion/react";
import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { preconnect } from "react-dom";
import { useSSR as useTranslateSSR } from "react-i18next";
import {
	href,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useMatch,
	useParams,
	useRouteLoaderData
} from "react-router";

import type { Route } from "./+types/root";
import { AnalyticsProvider } from "./analytics";
import { HavingIssuesViewport } from "./components/error";
import { InsetPreview } from "./components/inset-preview";
import { LoadingIndicator } from "./components/loading-indicator";
import { TooltipProvider } from "./components/tooltip";
import { UpdateInformation } from "./components/update-information";
import { apiOrigin, client, development, nativeOverride, platformOverride, siteOrigin } from "./const";
import { device } from "./hooks/use-device";
import { usePreferences } from "./hooks/use-preferences";
import { useTheme } from "./hooks/use-theme";
import { ToastProvider } from "./hooks/use-toast";
import { defaultLocale, i18n, localePathnameRegex, locales, replaceLanguage } from "./i18n";
import type { Locale } from "./i18n";
import { isLocale } from "./i18n/languages";
import { getPolyfillUrl, polyfillBaseUrl } from "./polyfill";
import { QueryProvider } from "./query";
import { RedirectBoundary } from "./redirect";
import { absoluteUrl, bucketOrigins, urls } from "./urls";

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

export function meta({
	location: { pathname },
	params: { locale = defaultLocale }
}: Pick<Route.MetaArgs, "location" | "params">): Route.MetaDescriptors {
	const t = i18n.getFixedT(locale);

	return [
		{ charSet: "utf-8" },
		{ name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no" },

		{ title: t("flirtual") },
		{ name: "description", content: t("knotty_direct_mongoose_bend") },

		{ name: "theme-color", media: "(prefers-color-scheme: light)", content: "#ffffff" },
		{ name: "theme-color", media: "(prefers-color-scheme: dark)", content: "#111111" },

		{ name: "twitter:card", content: "summary" },
		{ name: "twitter:site", content: `@${urls.socials.twitter.split("twitter.com/")[1]}` },
		{ name: "twitter:title", content: t("flirtual") },
		{ name: "twitter:description", content: t("green_plain_mongoose_lend") },
		{ name: "twitter:image:type", content: "image/png" },
		{ name: "twitter:image:width", content: 1000 },
		{ name: "twitter:image:height", content: 1000 },
		{ name: "twitter:image", content: urls.media("flirtual-mark-background.png") },
		{ property: "og:title", content: t("flirtual") },
		{ property: "og:description", content: t("green_plain_mongoose_lend") },
		{ property: "og:image:type", content: "image/png" },
		{ property: "og:image:width", content: 1000 },
		{ property: "og:image:height", content: 1000 },
		{ property: "og:image", content: urls.media("flirtual-mark-background.png") },
		{ property: "og:type", content: "website" },

		{ name: "application-name", content: t("flirtual") },
		{ name: "category", content: "technology" },
		{ name: "msapplication-TileColor", content: "#e9658b" },

		{ name: "mobile-web-app-capable", content: "yes" },

		{ name: "apple-itunes-app", content: "app-id=6450485324" },
		{ name: "apple-mobile-web-app-title", content: t("flirtual") },
		{ name: "apple-mobile-web-app-status-bar-style", content: "default" },
		{ property: "al:ios:app_store_id", content: "6450485324" },
		{ property: "al:ios:url", content: urls.apps.apple },
		{ property: "al:android:package", content: "zone.homie.flirtual.pwa" },
		{ property: "al:android:url", content: urls.apps.google },
		{ property: "al:web:should_fallback", content: (true).toString() },
		{ property: "al:web:url", content: siteOrigin },

		{ name: "darkreader-lock" },

		{ tagName: "link", rel: "manifest", href: href("/manifest.json") },

		{ tagName: "link", rel: "icon", type: "image/x-icon", sizes: "48x48", href: "/favicon.ico" },
		{ tagName: "link", rel: "icon", type: "image/svg+xml", sizes: "any", href: "/icon.svg" },
		{ tagName: "link", rel: "icon", type: "image/png", sizes: "32x32", href: "/icon-32x32.png" },
		{ tagName: "link", rel: "icon", type: "image/png", sizes: "16x16", href: "/icon-16x16.png" },
		{ tagName: "link", rel: "apple-touch-icon", type: "image/png", sizes: "180x180", href: "/apple-icon.png" },
		{ tagName: "link", rel: "mask-icon", color: "#e9658b", href: "/safari-pinned-tab.svg" },

		{
			tagName: "link",
			key: "canonical",
			rel: "canonical",
			hrefLang: locale,
			href: absoluteUrl(replaceLanguage(pathname, locale as Locale, pathname)).href
		},
		{
			tagName: "link",
			key: "alternate-default",
			rel: "alternate",
			hrefLang: "x-default",
			href: absoluteUrl(replaceLanguage(pathname, null, pathname)).href
		},

		...locales.map((locale) => {
			const { href } = absoluteUrl(replaceLanguage(pathname, locale, pathname));

			return ({
				tagName: "link",
				key: `alternate-${locale}`,
				rel: "alternate",
				hrefLang: locale,
				href
			});
		})
	];
}

// export function clientLoader({ request, params: { locale } }: Route.ClientLoaderArgs) {
// 	const url = new URL(request.url);
//
// 	if (!locale || !isLocale(locale)) {
// 		const recommendedLocale = getRecommendedLocale(navigator.languages.join(", ")) || defaultLocale;
//
// 		const to = createPath(replaceLanguage(url, recommendedLocale, url.pathname));
//
// 		logRendering(`Using recommended locale: ${recommendedLocale} (${to})`);
// 		throwRedirect(to);
// 	}
// }
//
// clientLoader.hydrate = true as const;

export function Layout({ children }: PropsWithChildren) {
	let { locale } = useParams();
	if (!locale || !isLocale(locale)) locale = defaultLocale;

	const { initialI18nStore = {} } = useRouteLoaderData<typeof loader>("root") || {};

	useTranslateSSR(initialI18nStore, locale);
	useEffect(() => void i18n.changeLanguage(locale), [locale]);

	preconnect(polyfillBaseUrl.origin);
	preconnect(apiOrigin);
	bucketOrigins.map((origin) => preconnect(origin));

	const [theme] = useTheme();
	const themeStyle = useMatch(urls.discover("homies")) ? "friend" : "default";

	const [fontSize] = usePreferences<number>("font_size", 16);

	// const location = useLocation();
	// hideLocale(location);

	return (
		<html
			suppressHydrationWarning
			style={{
				colorScheme: theme,
				fontSize: `${fontSize || 16}px`
			}}
			lang={locale}
		>
			<head>
				<Meta />
				<Links />
			</head>
			<body
				suppressHydrationWarning
				className="flex min-h-screen flex-col bg-white-20 font-nunito text-black-80 antialiased data-[theme=dark]:bg-black-70 data-[vision]:bg-transparent data-[theme=dark]:text-white-20 desktop:bg-cream desktop:data-[theme=dark]:bg-black-80"
				data-native={nativeOverride || (client && device.native) || undefined}
				data-platform={platformOverride || (client && device.platform) || undefined}
				data-theme={theme}
				data-theme-style={themeStyle}
			>
				<script
					// eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
					dangerouslySetInnerHTML={{
						__html: `(${((localePathnameRegex: RegExp, friendsPathname: string) => {
							const localTheme = JSON.parse(localStorage.getItem(".theme") || `"system"`);
							const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

							const theme = localTheme === "system" ? prefersDark : localTheme;
							const themeStyle = location.pathname.replace(localePathnameRegex, "") === friendsPathname ? "friend" : "default";

							Object.assign(document.body.dataset, { theme, themeStyle });

							const fontSize = JSON.parse(localStorage.getItem(".font_size") || "16") || 16;
							document.documentElement.style.setProperty("font-size", `${fontSize}px`);
						}).toString()})(${[
							localePathnameRegex,
							JSON.stringify(urls.discover("homies"))
						].join(", ")})`
					}}
				/>
				<script src={getPolyfillUrl(locale as Locale)} />
				<Sentry.ErrorBoundary fallback={({ error, eventId }) => <HavingIssuesViewport digest={eventId} error={error} />}>
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

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	return <HavingIssuesViewport error={error} />;
}

export function HydrateFallback() {
	return <LoadingIndicator />;
}

export default function App() {
	return <Outlet />;
}
