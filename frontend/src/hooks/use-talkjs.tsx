"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import Talk from "talkjs";

import { talkjsAppId } from "~/const";

import { useSession } from "./use-session";

const TalkjsContext = createContext<Talk.Session | null>(null);
const UnreadConversationContext = createContext<Array<Talk.UnreadConversation>>([]);

export const TalkjsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const [ready, setReady] = useState(false);
	const [authSession] = useSession();

	const [unreadConversations, setUnreadConversations] = useState<Array<Talk.UnreadConversation>>(
		[]
	);

	useEffect(() => void Talk.ready.then(() => setReady(true)), []);

	const session = useMemo(() => {
		if (!authSession || !ready) return null;

		return new Talk.Session({
			appId: talkjsAppId,
			signature: authSession.user.talkjsSignature,
			me: new Talk.User(authSession.user.id)
		});
	}, [authSession, ready]);

	useEffect(() => {
		setUnreadConversations([]);
		if (!session) return;

		const subscription = session.unreads.onChange(setUnreadConversations);
		return () => subscription.unsubscribe();
	}, [session]);

	useEffect(() => {
		return () => session?.destroy();
	}, [session]);

	return (
		<TalkjsContext.Provider value={session}>
			<UnreadConversationContext.Provider value={unreadConversations}>
				{children}
			</UnreadConversationContext.Provider>
		</TalkjsContext.Provider>
	);
};

export function useTalkjs() {
	return useContext(TalkjsContext);
}

export function useUnreadConversations() {
	return useContext(UnreadConversationContext);
}

export const ConversationInbox: React.FC<
	React.ComponentProps<"div"> & { options?: Talk.InboxOptions }
> = ({ options, ...props }) => {
	const session = useTalkjs();
	const [element, setElement] = useState<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!session || !element) return;
		const inbox = session.createInbox(options);

		// hack: mount.
		try {
			void inbox.mount(element).catch(() => {
				/* */
			});
		} catch (error) {
			/* */
		}

		// hack: mount again??
		// hack: fixes not rendering on desktop on client router change 😭
		setTimeout(() => {
			try {
				void inbox.mount(element).catch(() => {
					/* */
				});
			} catch (error) {
				/* */
			}
		}, 1);

		return () => inbox.destroy();
	}, [session, element, options]);

	return <div {...props} ref={setElement} />;
};

export const ConversationChatbox: React.FC<
	React.ComponentProps<"div"> & {
		options?: Talk.InboxOptions;
		userId: string | null;
	}
> = ({ options, userId, ...props }) => {
	const session = useTalkjs();
	const [element, setElement] = useState<HTMLDivElement | null>(null);

	const conversation = useMemo(() => {
		if (!session || !userId) return null;

		const conversationId = Talk.oneOnOneId(session.me, userId);
		return session.getOrCreateConversation(conversationId);
	}, [session, userId]);

	useEffect(() => {
		if (!session || !element) return;

		const chatbox = session.createChatbox(options);
		chatbox.select(conversation);

		// hack: fixes not rendering on desktop on client router change 😭
		setTimeout(() => void chatbox.mount(element), 1);

		return () => chatbox.destroy();
	}, [session, element, conversation, options]);

	return <div {...props} ref={setElement} />;
};
