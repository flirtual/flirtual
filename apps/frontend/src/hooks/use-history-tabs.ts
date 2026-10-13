import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import { createPath, matchPath, useLocation, useNavigationType } from "react-router";

import { defaultLocale, replaceLanguage, useNavigate } from "~/i18n";
import { getLocale } from "~/i18n/languages";
import { urls } from "~/urls";

import { useOptionalSession } from "./use-session";

// Each history entry's tab, by history index. Pages without one inherit the previous entry's.
const entryTabs = new Map<number, string | undefined>();

// Back arrow fallbacks of mounted pages, innermost last.
const upTargets: Array<string> = [];

let navigateTo: ((to: string) => void) | undefined;
let ownProfile: string | undefined;

export const historyIndex = () => (history.state as { idx?: number } | null)?.idx ?? 0;

const pathname = () => replaceLanguage(location, null).pathname;

function homeTab(path: string, slug?: string) {
	if (path === urls.discover("dates")) return "dates";
	if (path === urls.discover("homies")) return "homies";
	if (matchPath({ path: urls.conversations.list(), end: false }, path)) return "matches";
	if (matchPath({ path: "/settings", end: false }, path)) return "settings";
	if (slug && path === urls.profile(slug)) return "profile";
}

const startPages = [urls.discover("dates"), urls.discover("homies")];
let lastStartPage = startPages[0];
const otherTabRoots = () => [urls.conversations.list(), "/settings", ownProfile];

// Unknown entries, as after a reload, count as the same tab.
export function previousInTab() {
	const index = historyIndex();
	if (index === 0) return false;
	if (!entryTabs.has(index) || !entryTabs.has(index - 1)) return true;
	return entryTabs.get(index - 1) === entryTabs.get(index);
}

// Unknown entries count as another tab.
export function knownInTab(offset: number) {
	const index = historyIndex();
	return entryTabs.has(index) && entryTabs.has(index + offset) && entryTabs.get(index + offset) === entryTabs.get(index);
}

const upSubscribers = new Set<() => void>();
const notifyUp = () => upSubscribers.forEach((subscriber) => subscriber());

export function addUpTarget(to: string) {
	upTargets.push(to);
	notifyUp();

	return () => {
		upTargets.splice(upTargets.indexOf(to), 1);
		notifyUp();
	};
}

export function useUpTarget() {
	return useSyncExternalStore(
		(onChange) => {
			upSubscribers.add(onChange);
			return () => void upSubscribers.delete(onChange);
		},
		() => upTargets.at(-1),
		() => upTargets.at(-1)
	);
}

// Replaces the entry with `to` followed by the current page, then goes back, so forward returns to
// the page.
export function goUp(to: string) {
	const index = historyIndex();
	const page = { state: history.state as object, path: createPath(location) };
	const parent = createPath(replaceLanguage(to, getLocale(location.pathname) ?? defaultLocale));

	history.replaceState({ usr: null, key: Math.random().toString(36).slice(2, 10), idx: index }, "", parent);
	history.pushState({ ...page.state, idx: index + 1 }, "", page.path);

	for (const key of entryTabs.keys()) if (key > index) entryTabs.delete(key);
	entryTabs.set(index + 1, entryTabs.get(index));
	history.back();
}

// Android's back: exits from Dates and Homies, goes to whichever was last open from other tab
// roots, and otherwise back within the tab or up. Returns false to exit.
export function goBack(canGoBack: boolean) {
	const path = pathname();
	if (startPages.includes(path)) return false;

	if (otherTabRoots().includes(path)) {
		navigateTo?.(lastStartPage);
		return true;
	}

	if (previousInTab()) {
		history.back();
		return true;
	}

	const up = upTargets.at(-1);
	if (up) {
		goUp(up);
		return true;
	}

	if (!canGoBack) return false;
	history.back();
	return true;
}

export function useHistoryTabs() {
	const location = useLocation();
	const navigationType = useNavigationType();
	const navigate = useNavigate();
	const slug = useOptionalSession()?.user.slug;

	useEffect(() => {
		navigateTo = (to) => void navigate(to, { replace: true });
		ownProfile = slug && urls.profile(slug);
	}, [navigate, slug]);

	// Recorded before other effects read it.
	useLayoutEffect(() => {
		const index = historyIndex();
		if (navigationType === "PUSH") {
			for (const key of entryTabs.keys()) if (key > index) entryTabs.delete(key);
		}

		const path = replaceLanguage(location, null).pathname;
		if (startPages.includes(path)) lastStartPage = path;

		const tab = homeTab(path, slug)
			?? (entryTabs.has(index) ? entryTabs.get(index) : entryTabs.get(index - 1));
		entryTabs.set(index, tab);
	}, [location, navigationType, slug]);
}
