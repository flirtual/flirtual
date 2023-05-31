import { RefObject } from "react";

import { useGlobalEventListener } from "./use-event-listener";

export function useClickOutside<T extends HTMLElement>(
	ref: RefObject<T>,
	onClickOutside: (event: MouseEvent) => void,
	condition: boolean = true
) {
	useGlobalEventListener(
		"body",
		"click",
		(event) => {
			if (!(event.target instanceof HTMLElement) || !ref.current) return;
			if (event.target === ref.current || ref.current.contains(event.target)) return;
			onClickOutside(event);
		},
		condition
	);
}
