import { useDebugValue } from "react";

import { useMediaQuery } from "./use-media-query";

const breakpoints = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	"2xl": 1536
} as const;

export type ScreenBreakpoint = keyof typeof breakpoints;

export function useScreenBreakpoint(breakpoint: ScreenBreakpoint) {
	useDebugValue(breakpoint);

	return useMediaQuery(`(min-width: ${breakpoints[breakpoint]}px)`);
}
