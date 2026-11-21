import { useEffect, useState } from "react";

// Tracks whether a scroll container has more content above/below the viewport.
// Returns a callback ref to attach to the scrollable element, and the element itself.
export function useScrollIndicator<T extends HTMLElement>() {
	const [element, setElement] = useState<T | null>(null);
	const [state, setState] = useState({ up: false, down: false });

	useEffect(() => {
		if (!element) return;

		const update = () => {
			const { scrollTop, scrollHeight, clientHeight } = element;

			const up = scrollTop > 1;
			const down = Math.ceil(scrollTop + clientHeight) < scrollHeight - 1;

			setState((current) =>
				current.up === up && current.down === down
					? current
					: { up, down });
		};

		update();
		element.addEventListener("scroll", update, { passive: true });

		const resizeObserver = new ResizeObserver(update);
		resizeObserver.observe(element);

		// Content can grow/shrink without the viewport resizing (async loads,
		// filtering); watch the subtree so the arrows stay in sync.
		const mutationObserver = new MutationObserver(update);
		mutationObserver.observe(element, { childList: true, subtree: true });

		return () => {
			element.removeEventListener("scroll", update);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	}, [element]);

	return { ref: setElement, up: state.up, down: state.down, element };
}
