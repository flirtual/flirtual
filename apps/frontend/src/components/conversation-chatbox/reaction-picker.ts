const padding = 8;

export function followReactionPickers(container: HTMLElement): () => void {
	const shifts = new Map<HTMLElement, number>();

	const fit = (popover: HTMLElement) => {
		const boundary = popover.parentElement?.closest("[t-menu-boundary]");
		if (!boundary) return;

		const bounds = boundary.getBoundingClientRect();
		popover.style.setProperty("--reaction-picker-max-width", `${bounds.width - padding * 2}px`);
		popover.style.setProperty("--reaction-picker-max-height", `${bounds.height - padding * 2}px`);

		const shift = shifts.get(popover) ?? 0;
		const { top: shiftedTop, height } = popover.getBoundingClientRect();
		const top = shiftedTop - shift;
		const fitted = Math.max(Math.min(top, bounds.bottom - padding - height), bounds.top + padding);
		const next = Math.round(fitted - top);

		if (next === shift) return;
		shifts.set(popover, next);
		popover.style.translate = next ? `0 ${next}px` : "";
	};

	const resize = new ResizeObserver((entries) => {
		for (const { target } of entries) fit(target as HTMLElement);
	});

	const moves = new MutationObserver((records) => {
		for (const { target } of records) fit(target as HTMLElement);
	});

	const follow = () => {
		for (const popover of shifts.keys()) {
			if (popover.isConnected) continue;
			shifts.delete(popover);
			resize.unobserve(popover);
		}

		for (const popover of container.querySelectorAll<HTMLElement>("[t-popover-content]:has(.t-reaction-picker)")) {
			if (shifts.has(popover)) continue;
			shifts.set(popover, 0);
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
	};
}
