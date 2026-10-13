import { useCallback, useEffect } from "react";
import { createPath, useLocation } from "react-router";

import { replaceLanguage, useNavigate } from "~/i18n";

export interface MemoryTab {
	id: string;
	href: string;
}

// The page last visited in each tab and where it was scrolled, returned to when switching back.
const lastPages = new Map<string, string>();
const lastScrolls = new Map<string, number>();

const withoutLocale = (to: string) => replaceLanguage(to, null).pathname;

export async function restoreScroll(top: number) {
	// Retries for up to a second while the page loads.
	const until = performance.now() + 1000;
	for (;;) {
		window.scrollTo(0, top);
		if (Math.abs(window.scrollY - top) < 1 || performance.now() > until) return;
		await new Promise(requestAnimationFrame);
	}
}

// Returns a function to select a tab. Selecting the current tab goes to its first page, then
// scrolls to the top.
export function useTabMemory(tabs: Array<MemoryTab>, selected?: string) {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const tab = tabs.find(({ id }) => id === selected);
		if (!tab) return;

		const here = replaceLanguage(location, null);
		if (here.pathname === withoutLocale(tab.href)) lastPages.delete(tab.id);
		else lastPages.set(tab.id, createPath(here));
	}, [tabs, selected, location]);

	return useCallback((id: string) => {
		const tab = tabs.find((tab) => tab.id === id);
		if (!tab) return;

		if (id !== selected) {
			if (selected) lastScrolls.set(selected, window.scrollY);
			const top = lastScrolls.get(id) ?? 0;
			void Promise.resolve(navigate(lastPages.get(id) ?? tab.href, { preventScrollReset: true }))
				.then(() => restoreScroll(top));
			return;
		}

		if (replaceLanguage(location, null).pathname === withoutLocale(tab.href)) window.scrollTo({ top: 0, behavior: "smooth" });
		else void navigate(tab.href);
	}, [tabs, selected, location, navigate]);
}
