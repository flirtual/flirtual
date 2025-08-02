import { SafeArea } from "@capacitor-community/safe-area";
import type { FC, PropsWithChildren } from "react";
import { memo, useEffect } from "react";
import { preconnect } from "react-dom";
import { useSSR as useTranslateSSR } from "react-i18next";
import {
	href,
	Links,
	Meta,
	Scripts,
	ScrollRestoration,
	useMatch,
	useParams,
	useRouteLoaderData
} from "react-router";
import MarkBackground from "virtual:remote/flirtual-mark-background.png";

import type { Route } from "./+types/root";
import { App } from "./app";
import { HavingIssuesViewport } from "./components/error";
import { LoadingIndicator } from "./components/loading-indicator";
import { apiOrigin, client, development, nativeOverride, platformOverride, preview, siteOrigin } from "./const";
import { device } from "./hooks/use-device";
import { usePreferences } from "./hooks/use-preferences";
import { useTheme } from "./hooks/use-theme";
import type { LocalTheme } from "./hooks/use-theme";
import { defaultLocale, i18n, localePathnameRegex, locales, replaceLanguage } from "./i18n";
import type { Locale } from "./i18n";
import { isLocale } from "./i18n/languages";
import { PolyfillScript } from "./polyfill";
import { RedirectBoundary } from "./redirect";
import { absoluteUrl, bucketOrigins, urls } from "./urls";

import "@fontsource-variable/montserrat";
import "@fontsource-variable/nunito";
import "./app/index.css";

export async function loader({ params: { locale: _locale } }: Route.LoaderArgs) {
	const locale = !_locale || !isLocale(_locale) ? defaultLocale : _locale;
	await i18n.changeLanguage(locale);

	return {
		initialLocale: locale,
		initialTranslations: i18n.store.data[locale]
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
		{ name: "twitter:image", content: MarkBackground },
		{ property: "og:title", content: t("flirtual") },
		{ property: "og:description", content: t("green_plain_mongoose_lend") },
		{ property: "og:image:type", content: "image/png" },
		{ property: "og:image:width", content: 1000 },
		{ property: "og:image:height", content: 1000 },
		{ property: "og:image", content: MarkBackground },
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

		(development || preview || locale === "citext") && {
			tagName: "meta",
			name: "robots",
			content: "noindex, nofollow"
		},

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
	].filter(Boolean);
}

const BeforeRenderScript: FC = memo(() => {
	const beforeRender = (localePathnameRegex: RegExp, friendsPathname: string) => {
		const localTheme = JSON.parse(localStorage.getItem(".theme") || `"system"`) as LocalTheme;
		const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

		const theme = globalThis.theme = localTheme === "system" ? prefersDark : localTheme;
		const themeStyle = globalThis.themeStyle = location.pathname.replace(localePathnameRegex, "") === friendsPathname ? "friend" : "default";

		Object.assign(document.body.dataset, { theme, themeStyle });

		const fontSize = globalThis.fontSize = Number.parseInt(JSON.parse(localStorage.getItem(".font_size") || "16") as string) || 16;
		document.documentElement.style.setProperty("font-size", `${fontSize}px`);
	};

	return (
		<script
			// eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
			dangerouslySetInnerHTML={{
				__html: `(${beforeRender})(${[
					localePathnameRegex,
					JSON.stringify(urls.discover("homies"))
				].join(", ")})`
			}}
		/>
	);
});

export function Layout({ children }: PropsWithChildren) {
	const { initialLocale = defaultLocale, initialTranslations = {} } = useRouteLoaderData<typeof loader>("root") || { };

	const { locale } = useParams();

	useTranslateSSR({ [initialLocale]: initialTranslations }, initialLocale);
	useEffect(() => void i18n.changeLanguage(locale), [locale]);

	preconnect(apiOrigin);
	bucketOrigins.map((origin) => preconnect(origin));

	const [theme] = useTheme();
	const themeStyle = useMatch(urls.discover("homies")) ? "friend" : "default";

	const [fontSize] = usePreferences<number>("font_size", 16);

	return (
		<html
			suppressHydrationWarning
			ref={() => {
				SafeArea.enable({ config: {
					customColorsForSystemBars: true,
					statusBarColor: "#00000000",
					navigationBarColor: "#00000000",
					offset: 10
				} });
			}}
			style={{
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
				<BeforeRenderScript />
				<PolyfillScript locale={locale} />
				<RedirectBoundary>
					{children}
				</RedirectBoundary>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default App;

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	return <HavingIssuesViewport error={error} />;
}

export function HydrateFallback() {
	return <LoadingIndicator />;
}
