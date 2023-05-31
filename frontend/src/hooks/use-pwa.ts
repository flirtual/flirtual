import { useMediaQuery } from "./use-media-query";

export function useProgressiveWebApp() {
	return useMediaQuery("(display-mode: standalone)");
}
