// An avatar sticks to the top of the messages it heads, so it stays in view while you scroll
// through them (see Message). CSS can only make it stick within its TalkJS message group, which
// TalkJS ends after 60 seconds between messages, so this stretches each avatar's sticky area to the
// last message before the next avatar or another sender.
export function followStickyAvatars(container: HTMLElement): () => void {
	let frame = 0;

	const layout = () => {
		frame = 0;
		// TalkJS lists messages newest first.
		const messages = [...container.querySelectorAll<HTMLElement>(".chat-message")].reverse();

		messages.forEach((message, index) => {
			const area = message.querySelector<HTMLElement>(".chat-avatar > div");
			if (!area) return;

			const avatar = message.querySelector<HTMLElement>(".chat-avatar");
			if (!avatar || getComputedStyle(avatar).visibility !== "visible" || !area.offsetParent) {
				area.style.removeProperty("top");
				area.style.removeProperty("bottom");
				area.style.removeProperty("height");
				return;
			}

			let last = message;
			for (const next of messages.slice(index + 1)) {
				const nextAvatar = next.querySelector<HTMLElement>(".chat-avatar");
				if (next.dataset.sender !== message.dataset.sender || (nextAvatar && getComputedStyle(nextAvatar).visibility === "visible")) break;
				last = next;
			}

			// The area is positioned against the message group, which may start above this message, and
			// starts at the bubble, below any reply line.
			const group = area.offsetParent.getBoundingClientRect().top;
			const top = (message.querySelector("[data-bubble]") ?? message).getBoundingClientRect().top;
			area.style.top = `${top - group}px`;
			area.style.bottom = "auto";
			area.style.height = `${last.getBoundingClientRect().bottom - top}px`;
		});
	};

	const schedule = () => {
		frame ||= requestAnimationFrame(layout);
	};

	const resize = new ResizeObserver(schedule);
	const mutation = new MutationObserver(() => {
		resize.disconnect();
		for (const message of container.querySelectorAll(".chat-message")) resize.observe(message);
		schedule();
	});

	mutation.observe(container, { childList: true, subtree: true });
	schedule();

	return () => {
		cancelAnimationFrame(frame);
		mutation.disconnect();
		resize.disconnect();
	};
}
