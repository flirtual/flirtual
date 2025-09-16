import { useDebugValue } from "react";

import { useMediaQuery, useMediaQueryCallback } from "./use-media-query";

const breakpoints = {
	desktop: 960,
	wide: 1024
} as const;

export type Breakpoint = keyof typeof breakpoints;

const mediaQueries = Object.fromEntries(
	Object
		.entries(breakpoints)
		.map(([key, value]) => [key, `(min-width: ${value}px)`])
) as Record<Breakpoint, string>;

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
