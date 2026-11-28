import { createContext, use } from "react";
import type { Dispatch, SetStateAction } from "react";
import { doNothing } from "remeda";

import { emptyArray } from "~/utilities";

export interface UnreadConversation {
	id: string;
}

export interface UnreadConversations {
	unreadConversations: Array<UnreadConversation>;
	loadedAllUnreadConversations: boolean;
	setUnreadConversations: Dispatch<SetStateAction<Array<UnreadConversation>>>;
}

export const UnreadConversationContext = createContext<UnreadConversations>({
	unreadConversations: emptyArray,
	loadedAllUnreadConversations: true,
	setUnreadConversations: doNothing
});

export function useUnreadConversations() {
	return use(UnreadConversationContext);
}
