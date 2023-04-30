"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import Talk from "talkjs";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";

import { talkjsAppId } from "~/const";
import { resolveTheme } from "~/theme";

import { useSession } from "./use-session";
import { useTheme } from "./use-theme";
import { getKey } from "./use-conversations";

const TalkjsContext = createContext<Talk.Session | null>(null);
const UnreadConversationContext = createContext<Array<Talk.UnreadConversation>>([]);

export const TalkjsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const [ready, setReady] = useState(false);
	const [authSession] = useSession();

	const { mutate } = useSWRConfig();
	const router = useRouter();

	const [unreadConversations, setUnreadConversations] = useState<Array<Talk.UnreadConversation>>(
		[]
	);

	useEffect(() => void Talk.ready.then(() => setReady(true)), []);

	const userId = authSession?.user.id;
	const talkjsSignature = authSession?.user.talkjsSignature;

	const session = useMemo(() => {
		if (!userId || !talkjsSignature || !ready) return null;

		return new Talk.Session({
			appId: talkjsAppId,
			signature: talkjsSignature,
			me: new Talk.User(userId)
		});
	}, [userId, talkjsSignature, ready]);

	useEffect(() => {
		setUnreadConversations([]);
		if (!session) return;

		const messageSubscription = session.onMessage(async () => {
			await mutate(unstable_serialize(getKey));
			router.refresh();
		});
		const unreadSubscription = session.unreads.onChange(setUnreadConversations);

		return () => {
			unreadSubscription.unsubscribe();
			messageSubscription.unsubscribe();
		};
	}, [session, router, mutate]);

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

export const ConversationChatbox: React.FC<
	React.ComponentProps<"div"> & {
		userId: string | null;
	}
> = ({ userId, ...props }) => {
	const session = useTalkjs();
	const [element, setElement] = useState<HTMLDivElement | null>(null);

	const { sessionTheme } = useTheme();

	const chatbox = useMemo(() => {
		if (!session) return null;

		const dark = resolveTheme(sessionTheme) === "dark";
		const theme = dark ? "next-dark" : "next";

		return session.createChatbox({ theme });
	}, [session, sessionTheme]);

	const conversation = useMemo(() => {
		if (!session || !userId) return null;

		const conversationId = Talk.oneOnOneId(session.me, userId);
		return session.getOrCreateConversation(conversationId);
	}, [session, userId]);

	useEffect(() => {
		if (!chatbox || !conversation) return;
		chatbox.select(conversation);
	}, [chatbox, conversation]);

	useEffect(() => {
		if (!element) return;

		void chatbox?.mount(element);
		return () => chatbox?.destroy();
	}, [chatbox, element]);

	return <div {...props} ref={setElement} />;
};
