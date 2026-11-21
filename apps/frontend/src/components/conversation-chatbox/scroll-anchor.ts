const momentumIdle = 150;

interface Position {
	height: number;
	scrollTop: number;
	newest: Element | null;
	following: boolean;
}

// The message list scrolls in reverse, so its scrollTop is the distance from the newest message. Once
// it has been scrolled, WebKit keeps the distance from the top when it resizes instead, so opening the
// keyboard scrolls the newest messages out of view.
export function anchorMessageLists(container: HTMLElement): () => void {
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

			if (list.clientHeight !== position.height && !scrolling()) {
				if (position.following) list.scrollTo({ top: 0, behavior: "smooth" });
				else list.scrollTop = position.scrollTop;
			}
			position.height = list.clientHeight;
			if (!position.following) position.scrollTop = list.scrollTop;
		}
	});

	// A scroll caused by a resize arrives before the observer does.
	const onScroll = (event: Event) => {
		if (performance.now() < momentumUntil) momentumUntil = performance.now() + momentumIdle;
		const list = event.target as HTMLElement;
		const position = positions.get(list);
		if (!position) return;

		if (position.following) {
			if (Math.abs(list.scrollTop) < 1) position.following = false;
			return;
		}
		if (list.clientHeight === position.height) position.scrollTop = list.scrollTop;
	};

	const follow = () => {
		for (const list of positions.keys()) {
			if (list.isConnected) continue;
			positions.delete(list);
			resize.unobserve(list);
		}

		for (const list of container.querySelectorAll<HTMLElement>(".t-message-list")) {
			const newest = list.querySelector(".chat-message");
			const position = positions.get(list);
			if (!position) {
				positions.set(list, { height: list.clientHeight, scrollTop: list.scrollTop, newest, following: false });
				resize.observe(list);
				continue;
			}

			const last = position.newest;
			if (!newest || newest === last) continue;
			position.newest = newest;
			if (!last?.isConnected || !(newest.compareDocumentPosition(last) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;

			position.scrollTop = 0;
			position.following = Math.abs(list.scrollTop) >= 1;
			list.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	const added = new MutationObserver(follow);
	added.observe(container, { childList: true, subtree: true });
	const onTouchStart = () => {
		dragging = false;
		for (const position of positions.values()) position.following = false;
	};
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
