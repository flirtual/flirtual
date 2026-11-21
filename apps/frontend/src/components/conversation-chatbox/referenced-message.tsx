// Adapted from https://github.com/talkjs/themes/blob/6140418/default/react-tsx/ReferencedMessage.tsx
// Copyright (c) 2025 TalkJS (Klets B.V.), MIT License: https://github.com/talkjs/themes/blob/6140418/LICENSE.md

import type { ReferencedMessageProps } from "@talkjs/react-components";
import { Reply } from "lucide-react";

import { ReplyPreview } from "./reply-preview";
import { highlightMessage } from "./replying";
import { revealOffset } from "./scroll-anchor";

const scrollEndFallback = 700;
const gap = 16;

// TalkJS jumps to the message with scrollIntoView, which scrolls the page too and leaves it at the edge.
async function scrollToMessage(button: HTMLElement, id: string, focus: () => Promise<unknown>) {
	const list = button.closest(".t-message-list");
	if (!list) return;

	const outside: Array<{ element: Element; top: number; left: number }> = [];
	for (let element = list.parentElement; element; element = element.parentElement)
		outside.push({ element, top: element.scrollTop, left: element.scrollLeft });
	const from = list.scrollTop;

	await focus();
	for (const { element, top, left } of outside) element.scrollTo({ top, left, behavior: "instant" });
	list.scrollTo({ top: from, behavior: "instant" });

	const bubble = list.querySelector(`[t-message-id="${CSS.escape(id)}"] [data-bubble]`);
	if (!bubble) return;
	const offset = revealOffset(list, bubble, gap);
	if (!offset) return highlightMessage(id);

	let highlighted = false;
	const arrive = () => {
		if (highlighted) return;
		highlighted = true;
		highlightMessage(id);
	};
	list.addEventListener("scrollend", arrive, { once: true });
	setTimeout(arrive, scrollEndFallback);
	list.scrollTo({ top: from + offset, behavior: "smooth" });
}

// One muted line above the bubble, starting where the message text does (inside its 1rem padding).
export function ReferencedMessage({ referencedMessage, common }: ReferencedMessageProps) {
	return (
		<button
			className="mb-1 flex max-w-full cursor-pointer items-center gap-1 pl-4 text-[0.85em]! text-black-80! opacity-75 dark:text-white-20! hocus:opacity-100 vision:text-black-80!"
			type="button"
			onClick={({ currentTarget }) => scrollToMessage(currentTarget, referencedMessage.id, () => common.chatbox.focusMessage(referencedMessage.id))}
		>
			<Reply className="size-4 shrink-0 fill-none! opacity-75" />
			<ReplyPreview common={common} message={referencedMessage} />
		</button>
	);
}
