import type { MessageSnapshot, TextBlock } from "@talkjs/react-components";

// File and location sharing is disabled in TalkJS, but not enforced server-side, so we filter them
// here.
export function textContent(content: MessageSnapshot["content"]) {
	return content.filter((block): block is TextBlock => block.type === "text");
}
