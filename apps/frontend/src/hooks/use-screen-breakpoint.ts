import { useDebugValue } from "react";

import { useMediaQuery } from "./use-media-query";

const breakpoints = {
	desktop: 768,
	wide: 1024
} as const;

export type ScreenBreakpoint = keyof typeof breakpoints;

export function useScreenBreakpoint(breakpoint: ScreenBreakpoint) {
	useDebugValue(breakpoint);

	return useMediaQuery(`(min-width: ${breakpoints[breakpoint]}px)`);
}
