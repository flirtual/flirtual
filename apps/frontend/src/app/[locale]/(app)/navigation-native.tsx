import { registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { useEffect, useEffectEvent, useMemo } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { clamp } from "remeda";

import type { User } from "~/api/user";
import { useBreakpoint } from "~/hooks/use-breakpoint";
import { useHasConversations } from "~/hooks/use-conversations";
import { useUnreadConversations } from "~/hooks/use-talkjs";
import { useLocale, useMatch, useNavigate } from "~/i18n";
import { urls } from "~/urls";

interface NativeNavigationTab {
	id: string;
	title: string;
	// An asset in the app's catalog, or an SF Symbol.
	icon: string;
	badge?: string;
}

// What the system reserves in the top corners (iPhone Duo's status bar), in points. The height is
// only there when it fits in the top safe area, leaving the rest of the top edge free.
interface TopCorners {
	left?: number;
	right?: number;
	bottom?: number;
	height?: number;
}

// A fold splitting the page side by side (iPhone Duo partially open in landscape), in points.
interface Fold {
	x?: number;
	width?: number;
}

// Where the tab bar starts when it runs down a side, in points. Its buttons are anchored to the
// bottom, so anything above this is clear of them.
interface SideBar {
	top?: number;
	// Its middle, to tell which side it's on.
	x?: number;
}

// Where the tab bar starts when it runs along the bottom (iPhone), in points.
interface BottomBar {
	top?: number;
}

// How much further than the safe area content keeps from each side to clear the screen's rounded
// corners, in points.
interface Corners {
	left?: number;
	right?: number;
}

interface Layout {
	topCorners: TopCorners;
	fold: Fold;
	sideBar: SideBar;
	bottomBar: BottomBar;
	corners: Corners;
}

const NativeNavigationPlugin = registerPlugin<{
	update: (options: { visible: boolean; selected?: string; tabs?: Array<NativeNavigationTab>; tint?: string }) => Promise<Layout>;
	addListener: ((eventName: "layout", listener: (event: Layout) => void) => Promise<PluginListenerHandle>)
		& ((eventName: "select", listener: (event: { id: string }) => void) => Promise<PluginListenerHandle>);
}>("NativeNavigation");

// Where a corner status bar ends. When it fits in the top safe area, headers move up level with
// it, using --status-bar-inset-top in place of the top safe area.
function setTopCorners({ bottom, height }: TopCorners) {
	const { style } = document.body;
	const set = (property: string, value: string | undefined) => value === undefined
		? style.removeProperty(property)
		: style.setProperty(property, value);

	set("--status-bar-bottom", bottom === undefined ? undefined : `${bottom}px`);
	set("--status-bar-height", height === undefined ? undefined : `${height}px`);
	set("--status-bar-inset-top", height === undefined ? undefined : `calc(${height}px / 2 - 1.5rem)`);
}

// Splits the panes down the middle of the fold, so each fills its own half.
function setFold({ x, width }: Fold) {
	const { style } = document.body;

	if (x === undefined || width === undefined) {
		style.removeProperty("--split-list-width");
		return;
	}

	style.setProperty("--split-list-width", `calc(${x + width / 2}px - var(--content-inset-left, 0px))`);
}

// Content along the top keeps clear of a status bar in that corner. Above a vertical tab bar the
// top of its column is free, so content can run into it, short of the screen's corner. Elsewhere it
// keeps to the safe area and clear of the corner.
function setTopClearance(topCorners: TopCorners, sideBar: SideBar, corners: Corners) {
	const { style } = document.body;
	const barSide = sideBar.x === undefined ? undefined : sideBar.x < window.innerWidth / 2 ? "left" : "right";

	for (const side of ["left", "right"] as const) {
		const property = `--top-clearance-${side}`;
		const statusBar = topCorners[side];
		const corner = corners[side] ?? 0;

		if (statusBar) style.setProperty(property, `${statusBar}px`);
		else if (barSide === side) style.setProperty(property, `${corner}px`);
		else if (corner) style.setProperty(property, `calc(var(--content-inset-${side}) + ${corner}px)`);
		else style.removeProperty(property);
	}
}

function setLayout({ topCorners, fold, sideBar, bottomBar, corners }: Layout) {
	setTopCorners(topCorners);
	setTopClearance(topCorners, sideBar, corners);
	setFold(fold);

	const { style } = document.body;
	if (sideBar.top === undefined) style.removeProperty("--side-bar-top");
	else style.setProperty("--side-bar-top", `${sideBar.top}px`);

	// The bottom safe area holds the tab bar here, not just the home indicator, so content that pads
	// itself into it keeps this much clear of the bar.
	if (bottomBar.top === undefined) {
		delete document.body.dataset.tabBarBottom;
		style.removeProperty("--tab-bar-gap");
	}
	else {
		document.body.dataset.tabBarBottom = "";
		style.setProperty("--tab-bar-gap", "1rem");
	}
}

export const NativeNavigation: FC<{ user: User }> = ({ user }) => {
	const { t } = useTranslation();
	const [locale] = useLocale();
	const navigate = useNavigate();
	const isDesktop = useBreakpoint("desktop");
	// Wide screens keep the match list beside the queue, once there are matches.
	const wide = useBreakpoint("split");
	const hasConversations = useHasConversations();
	const split = wide && hasConversations;

	const { unreadConversations } = useUnreadConversations();
	const conversationCount = clamp(unreadConversations.length, { min: 0, max: 99 });
	const badge = conversationCount === 0
		? undefined
		: new Intl.NumberFormat(locale).format(conversationCount);

	const tabs = useMemo(() => [
		{ id: "dates", title: t("dates"), icon: "heart", href: urls.discover("dates") },
		{ id: "homies", title: t("homies"), icon: "peace", href: urls.discover("homies") },
		{ id: "matches", title: t("matches"), icon: "bubble.fill", href: urls.conversations.list(), badge },
		{ id: "settings", title: t("settings"), icon: "gearshape.fill", href: isDesktop ? urls.settings.matchmaking() : urls.settings.list() },
		{ id: "profile", title: t("profile"), icon: "person.crop.circle.fill", href: urls.profile(user.slug) }
	].filter(({ id }) => !split || id !== "matches"), [t, badge, user.slug, isDesktop, split]);

	const active: Record<string, boolean> = {
		dates: !!useMatch({ path: urls.discover("dates") }),
		homies: !!useMatch({ path: urls.discover("homies") }),
		matches: !!useMatch({ path: urls.conversations.list(), end: false }),
		profile: !!useMatch({ path: urls.profile(user.slug) }),
		settings: !!useMatch({ path: urls.settings.list(), end: false })
	};
	const selected = tabs.find(({ id }) => active[id])?.id;

	// Homie Mode's theme follows the route, so the selection changing covers it.
	useEffect(() => {
		const tint = getComputedStyle(document.body).getPropertyValue("--theme-2").trim();
		void NativeNavigationPlugin.update({ visible: true, selected, tabs, tint })
			.then(setLayout);
	}, [selected, tabs]);

	useEffect(() => {
		document.body.dataset.nativeNavigation = "";

		return () => {
			delete document.body.dataset.nativeNavigation;
			setLayout({ topCorners: {}, fold: {}, sideBar: {}, bottomBar: {}, corners: {} });
			void NativeNavigationPlugin.update({ visible: false });
		};
	}, []);

	const onSelect = useEffectEvent(({ id }: { id: string }) => {
		const tab = tabs.find((tab) => tab.id === id);
		if (!tab) return;

		if (id === selected) window.scrollTo({ top: 0, behavior: "smooth" });
		void navigate(tab.href);
	});

	useEffect(() => {
		const listeners = [
			NativeNavigationPlugin.addListener("select", (event) => onSelect(event)),
			NativeNavigationPlugin.addListener("layout", setLayout)
		];
		return () => void Promise.all(listeners.map((listener) => listener.then((handle) => handle.remove())));
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Takes the web navigation's place in the layout, reserving the inset that pages don't already
	// pad for: the tab bar at the bottom on phones, and whatever's above the desktop layout.
	return (
		<div className="order-last h-[var(--safe-area-inset-bottom,0rem)] shrink-0 split:hidden desktop:order-none desktop:block desktop:h-[var(--safe-area-inset-top,0rem)]" />
	);
};
