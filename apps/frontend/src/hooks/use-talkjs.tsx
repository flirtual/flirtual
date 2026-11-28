/* eslint-disable react-refresh/only-export-components */
import { getTalkSession } from "@talkjs/core";
import type { ConversationRef, TalkSession } from "@talkjs/core";
import ms from "ms" with { type: "macro" };
import {
	createContext,
	use,
	useEffect,
	useMemo,
	useState
} from "react";
import type { FC, PropsWithChildren } from "react";
import { doNothing } from "remeda";

import { talkjsAppId } from "~/const";
import { conversationsKey, invalidate, queryClient, sessionFetcher, sessionKey } from "~/query";
import { emptyArray } from "~/utilities";

import { warnOnce } from "./use-log";
import { useOptionalSession } from "./use-session";
import { UnreadConversationContext } from "./use-unread-conversations";
import type { UnreadConversation } from "./use-unread-conversations";

const TalkjsContext = createContext<TalkSession | null>(null);
// `onNeedToken` must retry on its own: https://talkjs.com/docs/Data_APIs/JavaScript/TalkSession/
async function fetchTalkjsToken() {
	for (let attempt = 0; ; attempt++) {
		try {
			const session = await queryClient.fetchQuery({
				queryKey: sessionKey(),
				queryFn: sessionFetcher,
				staleTime: 0
			});

			const token = session?.user.talkjsToken;
			if (token) return token;
		}
		catch {
			// 4xx rejects immediately; `queryClient` retries the rest.
		}

		await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** attempt, ms("5m"))));
	}
}

// `getTalkSession` returns one shared session per app and user, so the `<Chatbox>` reuses this
// one and its token.
function talkSession(userId: string) {
	const session = getTalkSession({ appId: talkjsAppId, userId });
	session.onNeedToken = () => void fetchTalkjsToken().then((token) => session.setToken(token));

	// The chatbox's editor marks the user as typing on every change, whatever the role's
	// `showTypingIndicators` says, and offers no option to stop it. `ConversationRef`s are frozen,
	// so this replaces the method on their shared prototype.
	const conversationPrototype: ConversationRef = Object.getPrototypeOf(session.conversation("typing"));
	conversationPrototype.markAsTyping = async () => {};

	return session;
}

const TalkjsProvider_: FC<PropsWithChildren> = ({ children }) => {
	const authSession = useOptionalSession();
	const talkjsUserId = authSession?.user.talkjsId;

	const [unreadConversations, setUnreadConversations] = useState<Array<UnreadConversation>>([]);
	const [loadedAllUnreadConversations, setLoadedAllUnreadConversations] = useState(true);

	const session = useMemo(() => talkjsUserId ? talkSession(talkjsUserId) : null, [talkjsUserId]);

	useEffect(() => {
		if (!session) return;

		// One page of unread conversations serves the badge and the list's refetch. TalkJS keeps a live
		// last-message subscription for every conversation it lists, and replays each one after a
		// reconnect, so loading more delays the conversation being opened.
		const unreadSubscription = session.subscribeConversations(
			{ filter: { isUnread: true } },
			(snapshot, loadedAll) => {
				setUnreadConversations(snapshot);
				setLoadedAllUnreadConversations(loadedAll);
				void invalidate({ queryKey: conversationsKey() });
			}
		);

		return () => {
			unreadSubscription.unsubscribe();
			setUnreadConversations([]);
			setLoadedAllUnreadConversations(true);
		};
	}, [session]);

	const unreadConversationContext = useMemo(() => ({
		unreadConversations,
		loadedAllUnreadConversations,
		setUnreadConversations
	}), [unreadConversations, loadedAllUnreadConversations]);

	return (
		<TalkjsContext value={session}>
			<UnreadConversationContext value={unreadConversationContext}>
				{children}
			</UnreadConversationContext>
		</TalkjsContext>
	);
};

if (!talkjsAppId)
	warnOnce("Talk.js is not configured properly, conversations & related features are disabled. To enable them, set \"VITE_TALKJS_APP_ID\" in your environment.");

const FallbackProvider: FC<PropsWithChildren> = ({ children }) => {
	const value = useMemo(() => ({ unreadConversations: emptyArray, loadedAllUnreadConversations: true, setUnreadConversations: doNothing }), []);

	return (
		<TalkjsContext value={null}>
			<UnreadConversationContext value={value}>
				{children}
			</UnreadConversationContext>
		</TalkjsContext>
	);
};

export const TalkjsProvider = talkjsAppId
	? TalkjsProvider_
	: FallbackProvider;

TalkjsProvider.displayName = "TalkjsProvider";

export function useTalkjs() {
	return use(TalkjsContext);
}
