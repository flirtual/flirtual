import { useDebugValue } from "react";

import { nativeNavigation } from "./use-device";
import { useMediaQuery, useMediaQueryCallback } from "./use-media-query";

const mediaQueries = {
	split: "(min-width: 900px)",
	desktop: "(min-width: 960px)",
	wide: "(min-width: 1024px)",
	narrow: "(max-width: 959.98px) and (min-aspect-ratio: 3/4)"
} as const;

export type Breakpoint = keyof typeof mediaQueries;

// Side-by-side panes need the native tab bar, which drops the Matches tab for them.
const available = (breakpoint: Breakpoint) => breakpoint !== "split" || nativeNavigation;

export const isSplit = () => available("split") && matchMedia(mediaQueries.split).matches;
export const isDesktop = () => matchMedia(mediaQueries.desktop).matches;
export const isWide = () => matchMedia(mediaQueries.wide).matches;

export function useBreakpoint(breakpoint: Breakpoint) {
	useDebugValue(breakpoint);

	return useMediaQuery(mediaQueries[breakpoint], false) && available(breakpoint);
}

export function useBreakpointCallback(
	breakpoint: Breakpoint,
	callback: (event: Pick<MediaQueryListEvent, "matches">) => void
) {
	useDebugValue(breakpoint);
	return useMediaQueryCallback(mediaQueries[breakpoint], callback);
}
