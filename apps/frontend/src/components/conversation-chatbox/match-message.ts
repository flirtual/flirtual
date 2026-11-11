import type { MessageSnapshot } from "@talkjs/core";

// Sent in English by `Matchmaking.create_match_conversation` in the API; shown translated instead.
const matchMessageText = "It's a match!";

export function isMatchMessage({ type, plaintext }: Pick<MessageSnapshot, "plaintext" | "type">) {
	return type === "SystemMessage" && plaintext === matchMessageText;
}
