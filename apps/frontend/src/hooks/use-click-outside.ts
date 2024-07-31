import { useGlobalEventListener } from "./use-event-listener";

import type { RefObject } from "react";

export function useClickOutside<T extends HTMLElement>(
	reference: RefObject<T>,
	onClickOutside: (event: MouseEvent) => void,
	condition: boolean = true
) {
	useGlobalEventListener(
		"body",
		"click",
		(event) => {
			if (!(event.target instanceof HTMLElement) || !reference.current) return;
			if (
				event.target === reference.current ||
				reference.current.contains(event.target)
			)
				return;
			onClickOutside(event);
		},
		condition
	);
}
