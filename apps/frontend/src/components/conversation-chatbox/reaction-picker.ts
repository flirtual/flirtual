const padding = 8;
const gap = 4;
export const minPickerHeight = 280;

export function followReactionPickers(container: HTMLElement): () => void {
	const followed = new Map<HTMLElement, () => void>();

	const fit = (popover: HTMLElement) => {
		const boundary = popover.parentElement?.closest("[t-menu-boundary]");
		const anchor = popover.parentElement?.getBoundingClientRect();
		if (!boundary || !anchor) return;

		const bounds = boundary.getBoundingClientRect();
		const above = anchor.top - gap - (bounds.top + padding);
		const below = bounds.bottom - padding - (anchor.bottom + gap);
		popover.style.setProperty("--reaction-picker-max-width", `${bounds.width - padding * 2}px`);
		popover.style.setProperty("--reaction-picker-max-height", `${Math.max(above, below, minPickerHeight)}px`);

		const { top: shiftedTop, height } = popover.getBoundingClientRect();
		const shift = Number.parseFloat(popover.style.translate.split(" ")[1] ?? "") || 0;
		const top = shiftedTop - shift;
		const placedBelow = top >= anchor.top;
		const fitsBelow = below >= height;
		const fitsAbove = above >= height;
		const useBelow = fitsBelow && fitsAbove ? placedBelow : fitsBelow || (!fitsAbove && below >= above);

		const placed = useBelow ? anchor.bottom + gap : anchor.top - gap - height;
		const fitted = Math.max(Math.min(placed, bounds.bottom - padding - height), bounds.top + padding);
		const next = Math.round(fitted - top);
		if (next === shift) return;
		popover.style.translate = next ? `0 ${next}px` : "";
	};

	const resize = new ResizeObserver((entries) => {
		for (const { target } of entries) fit(target as HTMLElement);
	});

	const moves = new MutationObserver((records) => {
		for (const { target } of records) fit(target as HTMLElement);
	});

	const follow = () => {
		for (const [popover, stop] of followed) {
			if (popover.isConnected) continue;
			stop();
			followed.delete(popover);
			resize.unobserve(popover);
		}

		for (const popover of container.querySelectorAll<HTMLElement>(".t-message-list [t-popover-content]:has(.t-reaction-picker)")) {
			if (followed.has(popover)) continue;
			const list = popover.closest<HTMLElement>(".t-message-list")!;

			// TalkJS focusing its search on desktop scrolls the chat; fit() already brings it into view.
			const scrollTop = list.scrollTop;
			const opened = performance.now();
			popover.addEventListener("focusin", () => {
				if (performance.now() - opened < 500) list.scrollTop = scrollTop;
			}, { once: true });

			// TalkJS closes it on a click outside, but not a scroll.
			const stop = () => {
				list.removeEventListener("touchmove", close);
				list.removeEventListener("wheel", close);
			};
			const close = ({ target }: Event) => {
				if (target instanceof Node && popover.contains(target)) return;
				stop();
				if (popover.previousElementSibling instanceof HTMLElement) popover.previousElementSibling.click();
			};
			list.addEventListener("touchmove", close, { passive: true });
			list.addEventListener("wheel", close, { passive: true });
			followed.set(popover, stop);

			moves.observe(popover, { attributes: true, attributeFilter: ["style"] });
			resize.observe(popover);
			fit(popover);
		}
	};

	const added = new MutationObserver(follow);
	added.observe(container, { childList: true, subtree: true });
	follow();

	return () => {
		added.disconnect();
		moves.disconnect();
		resize.disconnect();
		for (const stop of followed.values()) stop();
	};
}
