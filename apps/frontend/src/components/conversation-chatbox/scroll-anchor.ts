const momentumIdle = 150;

interface Position {
	height: number;
	scrollTop: number;
}

// The message list scrolls in reverse, so its scrollTop is the distance from the newest message. Once
// it has been scrolled, WebKit keeps the distance from the top when it resizes instead, so opening the
// keyboard scrolls the newest messages out of view.
export function followMessageListResizes(container: HTMLElement): () => void {
	const positions = new Map<HTMLElement, Position>();

	// Restoring the position mid-scroll would make the list jump under the finger.
	let dragging = false;
	let momentumUntil = 0;
	const scrolling = () => dragging || performance.now() < momentumUntil;

	const resize = new ResizeObserver((entries) => {
		for (const { target } of entries) {
			const list = target as HTMLElement;
			const position = positions.get(list);
			if (!position) continue;

			if (list.clientHeight !== position.height && !scrolling()) list.scrollTop = position.scrollTop;
			position.height = list.clientHeight;
			position.scrollTop = list.scrollTop;
		}
	});

	// A scroll caused by a resize arrives before the observer does.
	const onScroll = (event: Event) => {
		if (performance.now() < momentumUntil) momentumUntil = performance.now() + momentumIdle;
		const list = event.target as HTMLElement;
		const position = positions.get(list);
		if (!position || list.clientHeight !== position.height) return;
		position.scrollTop = list.scrollTop;
	};

	const follow = () => {
		for (const list of positions.keys()) {
			if (list.isConnected) continue;
			positions.delete(list);
			resize.unobserve(list);
		}

		for (const list of container.querySelectorAll<HTMLElement>(".t-message-list")) {
			if (positions.has(list)) continue;
			positions.set(list, { height: list.clientHeight, scrollTop: list.scrollTop });
			resize.observe(list);
		}
	};

	const added = new MutationObserver(follow);
	added.observe(container, { childList: true, subtree: true });
	const onTouchStart = () => (dragging = false);
	const onTouchMove = ({ target }: TouchEvent) => {
		if (target instanceof Element && target.closest(".t-message-list")) dragging = true;
	};
	const onTouchEnd = () => {
		if (dragging) momentumUntil = performance.now() + momentumIdle;
		dragging = false;
	};

	const options = { capture: true, passive: true };
	container.addEventListener("scroll", onScroll, options);
	container.addEventListener("touchstart", onTouchStart, options);
	container.addEventListener("touchmove", onTouchMove, options);
	container.addEventListener("touchend", onTouchEnd, options);
	container.addEventListener("touchcancel", onTouchEnd, options);
	follow();

	return () => {
		added.disconnect();
		resize.disconnect();
		container.removeEventListener("scroll", onScroll, options);
		container.removeEventListener("touchstart", onTouchStart, options);
		container.removeEventListener("touchmove", onTouchMove, options);
		container.removeEventListener("touchend", onTouchEnd, options);
		container.removeEventListener("touchcancel", onTouchEnd, options);
	};
}
