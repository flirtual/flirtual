import { registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { useEffect, useEffectEvent, useMemo } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { clamp } from "remeda";

import type { User } from "~/api/user";
import { useBreakpoint } from "~/hooks/use-breakpoint";
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

// What the system reserves in the top corners (iPhone Duo's status bar in inner portrait), in
// points. Empty unless the rest of the top edge is free.
interface TopCorners {
	left?: number;
	right?: number;
	height?: number;
}

const NativeNavigationPlugin = registerPlugin<{
	update: (options: { visible: boolean; selected?: string; tabs?: Array<NativeNavigationTab>; tint?: string }) => Promise<{ topCorners: TopCorners }>;
	addListener: ((eventName: "layout", listener: (event: TopCorners) => void) => Promise<PluginListenerHandle>)
		& ((eventName: "select", listener: (event: { id: string }) => void) => Promise<PluginListenerHandle>);
}>("NativeNavigation");

// Lets headers sit beside a corner status bar instead of below it, level with it: they use
// --status-bar-inset-top in place of the top safe area, and keep the clearance on either side.
function setTopCorners({ left = 0, right = 0, height }: TopCorners) {
	const { style } = document.body;

	if (!height) {
		for (const property of ["--status-bar-height", "--status-bar-inset-top", "--status-bar-clearance-left", "--status-bar-clearance-right"])
			style.removeProperty(property);
		return;
	}

	style.setProperty("--status-bar-height", `${height}px`);
	style.setProperty("--status-bar-inset-top", `calc(${height}px / 2 - 1.5rem)`);
	style.setProperty("--status-bar-clearance-left", `${left}px`);
	style.setProperty("--status-bar-clearance-right", `${right}px`);
}

export const NativeNavigation: FC<{ user: User }> = ({ user }) => {
	const { t } = useTranslation();
	const [locale] = useLocale();
	const navigate = useNavigate();
	const isDesktop = useBreakpoint("desktop");

	const { unreadConversations } = useUnreadConversations();
	const conversationCount = clamp(unreadConversations.length, { min: 0, max: 99 });
	const badge = conversationCount === 0
		? undefined
		: new Intl.NumberFormat(locale).format(conversationCount);

	const tabs = useMemo(() => [
		{ id: "dates", title: t("browse"), icon: "heart", href: urls.discover("dates") },
		{ id: "homies", title: t("homie_mode"), icon: "peace", href: urls.discover("homies") },
		{ id: "matches", title: t("matches"), icon: "bubble.fill", href: urls.conversations.list(), badge },
		{ id: "profile", title: t("profile"), icon: "person.crop.circle.fill", href: urls.profile(user.slug) },
		{ id: "settings", title: t("settings"), icon: "gearshape.fill", href: isDesktop ? urls.settings.matchmaking() : urls.settings.list() }
	], [t, badge, user.slug, isDesktop]);

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
			.then(({ topCorners }) => setTopCorners(topCorners));
	}, [selected, tabs]);

	useEffect(() => {
		document.body.dataset.nativeNavigation = "";

		return () => {
			delete document.body.dataset.nativeNavigation;
			setTopCorners({});
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
			NativeNavigationPlugin.addListener("layout", setTopCorners)
		];
		return () => void Promise.all(listeners.map((listener) => listener.then((handle) => handle.remove())));
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Takes the web navigation's place in the layout, reserving the inset that pages don't already
	// pad for: the tab bar at the bottom on phones, and whatever's above the desktop layout.
	return (
		<div className="order-last h-[var(--safe-area-inset-bottom,0rem)] shrink-0 desktop:order-none desktop:h-[var(--safe-area-inset-top,0rem)]" />
	);
};
