import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { createPath, generatePath, matchPath } from "react-router";

import { redirects } from "~/app/_redirects";
import { defaultLocale, replaceLanguage, useNavigate } from "~/i18n";
import { getLocale } from "~/i18n/languages";
import { deepLinkToRelativeUrl, isInternalHref } from "~/urls";

// Links already followed this session. getLaunchUrl keeps returning the launch link on Android and
// the last link on iOS, so a reload shouldn't follow it again.
const handledKey = "handled-deep-links";

let navigateTo: ((to: string) => void) | undefined;
let pending: string | undefined;

function handled(): Array<string> {
	try {
		return JSON.parse(sessionStorage.getItem(handledKey) ?? "[]") as Array<string>;
	}
	catch {
		return [];
	}
}

function markHandled(url: string) {
	try {
		sessionStorage.setItem(handledKey, JSON.stringify([...handled().filter((value) => value !== url), url].slice(-20)));
	}
	catch {}
}

// Follows the server's redirects for old paths, which the app's routes don't know.
function redirected(href: string) {
	const url = new URL(href, location.origin);
	if (getLocale(url.pathname)) return href;

	for (const { source, destination } of redirects) {
		const match = matchPath(source, url.pathname);
		if (!match) continue;

		return destination.startsWith("/")
			? `${generatePath(destination, match.params)}${url.search}${url.hash}`
			: destination;
	}

	return href;
}

function toHref(url: string) {
	const href = deepLinkToRelativeUrl(url);

	// Native OAuth deep links are consumed by the plugin, not webview navigation.
	if (!href || href.startsWith("/oauth-callback") || href.startsWith("/apple-login")) return null;
	return redirected(href);
}

function withLocale(href: string) {
	return createPath(replaceLanguage(href, getLocale(href) ?? getLocale(location.pathname) ?? defaultLocale));
}

// Opens a link without loading the page again. A page load that starts while React Router is still
// loading routes makes it reload the old page instead.
export function openDeepLink(url: string) {
	const href = toHref(url);
	if (!href) return;

	markHandled(url);
	if (navigateTo) navigateTo(href);
	else pending = href;
}

// Before the app starts, moves to the link it was opened with, so it starts there.
export async function followLaunchDeepLink() {
	if (!Capacitor.isNativePlatform()) return;

	const launch = await Promise.race([
		App.getLaunchUrl().catch(() => {}),
		new Promise<undefined>((resolve) => setTimeout(resolve, 1000))
	]);
	if (!launch?.url || handled().includes(launch.url)) return;

	const href = toHref(launch.url);
	markHandled(launch.url);
	if (!href) return;

	if (!isInternalHref(href)) {
		location.replace(href);
		return "redirecting";
	}

	history.replaceState(history.state, "", withLocale(href));
}

export function useDeepLinks() {
	const navigate = useNavigate();

	useEffect(() => {
		navigateTo = (href) => {
			if (!isInternalHref(href)) return location.assign(href);

			const to = withLocale(href);
			if (to !== createPath(location)) void navigate(to);
		};

		if (pending) navigateTo(pending);
		pending = undefined;

		return () => {
			navigateTo = undefined;
		};
	}, [navigate]);
}
