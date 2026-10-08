import { useDebugValue } from "react";

import { useMediaQuery, useMediaQueryCallback } from "./use-media-query";

const mediaQueries = {
	desktop: "(min-width: 960px)",
	wide: "(min-width: 1024px)",
	"landscape-phone": "(orientation: landscape) and (max-height: 450px) and (max-width: 959.98px)"
} as const;

export type Breakpoint = keyof typeof mediaQueries;

export const isDesktop = () => matchMedia(mediaQueries.desktop).matches;
export const isWide = () => matchMedia(mediaQueries.wide).matches;

export function useBreakpoint(breakpoint: Breakpoint) {
	useDebugValue(breakpoint);

	return useMediaQuery(mediaQueries[breakpoint], false);
}

export function useBreakpointCallback(
	breakpoint: Breakpoint,
	callback: (event: Pick<MediaQueryListEvent, "matches">) => void
) {
	useDebugValue(breakpoint);
	return useMediaQueryCallback(mediaQueries[breakpoint], callback);
}
