const slop = 10;

export function hideKeyboardOnScroll(container: HTMLElement): () => void {
	let start: { x: number; y: number } | null = null;

	const onTouchStart = (event: TouchEvent) => {
		const [touch] = event.touches;
		const inList = event.target instanceof Element && event.target.closest(".t-message-list");
		start = event.touches.length === 1 && touch && inList ? { x: touch.clientX, y: touch.clientY } : null;
	};

	const onTouchMove = (event: TouchEvent) => {
		const [touch] = event.touches;
		if (!start || !touch) return;

		const dx = Math.abs(touch.clientX - start.x);
		const dy = Math.abs(touch.clientY - start.y);
		if (dy < slop || dy < dx) return;

		start = null;
		const active = document.activeElement;
		if (active instanceof HTMLElement && active.matches("input, textarea, [contenteditable='true']")) active.blur();
	};

	container.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
	container.addEventListener("touchmove", onTouchMove, { capture: true, passive: true });
	return () => {
		container.removeEventListener("touchstart", onTouchStart, { capture: true });
		container.removeEventListener("touchmove", onTouchMove, { capture: true });
	};
}
