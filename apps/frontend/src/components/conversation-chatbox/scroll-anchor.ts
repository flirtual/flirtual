interface Position {
	height: number;
	scrollTop: number;
}

// The message list scrolls in reverse, so its scrollTop is the distance from the newest message. Once
// it has been scrolled, WebKit keeps the distance from the top when it resizes instead, so opening the
// keyboard scrolls the newest messages out of view.
export function followMessageListResizes(container: HTMLElement): () => void {
	const positions = new Map<HTMLElement, Position>();

	const resize = new ResizeObserver((entries) => {
		for (const { target } of entries) {
			const list = target as HTMLElement;
			const position = positions.get(list);
			if (!position) continue;

			if (list.clientHeight !== position.height) list.scrollTop = position.scrollTop;
			position.height = list.clientHeight;
			position.scrollTop = list.scrollTop;
		}
	});

	// A scroll caused by a resize arrives before the observer does.
	const onScroll = (event: Event) => {
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
	container.addEventListener("scroll", onScroll, { capture: true, passive: true });
	follow();

	return () => {
		added.disconnect();
		resize.disconnect();
		container.removeEventListener("scroll", onScroll, { capture: true });
	};
}
