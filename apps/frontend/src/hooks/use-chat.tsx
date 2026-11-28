/* eslint-disable react-refresh/only-export-components */
import { Socket } from "phoenix";
import type { Channel } from "phoenix";
import { useEffect, useMemo, useState } from "react";
import type { FC, PropsWithChildren } from "react";

import { Conversation } from "~/api/conversations";
import { apiOrigin } from "~/const";
import { conversationKey, conversationsKey, invalidate } from "~/query";

import { useOptionalSession } from "./use-session";
import { UnreadConversationContext } from "./use-unread-conversations";
import type { UnreadConversation } from "./use-unread-conversations";

let socket: Socket | null = null;
let socketUserId: string | null = null;
let token: string | null = null;
let tokenRequest: Promise<void> | null = null;
let tokenTimer: ReturnType<typeof setTimeout> | undefined;

function refreshToken() {
	tokenRequest ??= Conversation.token()
		.then((response) => {
			token = response.token;
			clearTimeout(tokenTimer);
			tokenTimer = setTimeout(() => void refreshToken(), response.expiresIn * 750);
		})
		.catch(() => {})
		.finally(() => (tokenRequest = null));

	return tokenRequest;
}

export function chatSocket(userId: string): Socket {
	if (socket && socketUserId === userId) return socket;
	closeChatSocket();

	const created = new Socket(`${apiOrigin.replace(/^http/, "ws")}/chat`, {
		params: () => ({ token }),
		reconnectAfterMs: (tries) => [250, 500, 1000, 2000, 5000][tries - 1] ?? 10_000,
		rejoinAfterMs: (tries) => [250, 500, 1000, 2000][tries - 1] ?? 5000
	});

	created.onError(() => void refreshToken());
	socket = created;
	socketUserId = userId;
	void refreshToken().then(() => socket === created && created.connect());

	return created;
}

export function closeChatSocket() {
	clearTimeout(tokenTimer);
	socket?.disconnect();
	socket = null;
	socketUserId = null;
	token = null;
}

function reconnectWhenBack() {
	if (document.visibilityState !== "visible" || !socket || socket.isConnected()) return;
	socket.connect();
}

export const ChatProvider: FC<PropsWithChildren> = ({ children }) => {
	const session = useOptionalSession();
	const userId = session?.user.id;

	const [unreadConversations, setUnreadConversations] = useState<Array<UnreadConversation>>([]);
	const [loadedAllUnreadConversations, setLoadedAllUnreadConversations] = useState(true);

	useEffect(() => {
		if (!userId) return;

		const channel: Channel = chatSocket(userId).channel(`user:${userId}`);

		channel.on("conversation", ({ id, unread }: { id: string; unread: boolean }) => {
			setUnreadConversations((conversations) => {
				const without = conversations.filter((conversation) => conversation.id !== id);
				return unread ? [{ id }, ...without] : without;
			});
			void invalidate({ queryKey: conversationsKey() });
			void invalidate({ queryKey: conversationKey(id) });
		});

		channel.join().receive("ok", ({ unread, complete }: { unread: Array<string>; complete: boolean }) => {
			setUnreadConversations(unread.map((id) => ({ id })));
			setLoadedAllUnreadConversations(complete);
			void invalidate({ queryKey: conversationsKey() });
		});

		document.addEventListener("visibilitychange", reconnectWhenBack);
		window.addEventListener("online", reconnectWhenBack);

		return () => {
			document.removeEventListener("visibilitychange", reconnectWhenBack);
			window.removeEventListener("online", reconnectWhenBack);
			channel.leave();
			closeChatSocket();
			setUnreadConversations([]);
			setLoadedAllUnreadConversations(true);
		};
	}, [userId]);

	const value = useMemo(() => ({
		unreadConversations,
		loadedAllUnreadConversations,
		setUnreadConversations
	}), [unreadConversations, loadedAllUnreadConversations]);

	return <UnreadConversationContext value={value}>{children}</UnreadConversationContext>;
};
