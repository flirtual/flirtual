import { createContext, use } from "react";

import type { User } from "~/api/user";

import type { Match } from "./match-card";
import type { ChatMessage, ChatReply, ChatState, ChatStore } from "./store";

export interface ChatContextValue {
	store: ChatStore;
	conversationId: string;
	me: User;
	people: Readonly<Record<string, User>>;
	match?: Match;
	readOnly: boolean;
	setReplyingTo: (message: ChatMessage | null) => void;
	setEditing: (messageId: string | null) => void;
	focusField: () => void;
	reveal: (reply: ChatReply, from: HTMLElement) => void;
	toggleReaction: (message: ChatMessage, emoji: string) => void;
}

export interface ChatStateValue {
	state: ChatState;
	replyingTo: ChatMessage | null;
	editing: string | null;
}

export const ChatContext = createContext<ChatContextValue | null>(null);
export const ChatStateContext = createContext<ChatStateValue | null>(null);

export function useChat() {
	const value = use(ChatContext);
	if (!value) throw new Error("useChat outside a chat");
	return value;
}

export function useChatState() {
	const value = use(ChatStateContext);
	if (!value) throw new Error("useChatState outside a chat");
	return value;
}
