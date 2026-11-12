/* eslint-disable react-refresh/only-export-components */
import { getTalkSession } from "@talkjs/core";
import type { ConversationSnapshot, TalkSession } from "@talkjs/core";
import ms from "ms" with { type: "macro" };
import {
	createContext,
	use,
	useEffect,
	useMemo,
	useState
} from "react";
import type { Dispatch, FC, PropsWithChildren, SetStateAction } from "react";
import { doNothing } from "remeda";

import { talkjsAppId } from "~/const";
import { conversationsKey, invalidate, queryClient, sessionFetcher, sessionKey } from "~/query";
import EmojiBonk from "~/static/emoji/bonk.gif";
import EmojiChad from "~/static/emoji/chad.png";
import EmojiCool from "~/static/emoji/cool.png";
import EmojiCupid from "~/static/emoji/cupid.png";
import EmojiDj from "~/static/emoji/dj.png";
import EmojiEtto from "~/static/emoji/etto.png";
import EmojiEw from "~/static/emoji/ew.png";
import EmojiHeadphones from "~/static/emoji/headphones.gif";
import EmojiLong from "~/static/emoji/long.png";
import EmojiNerd from "~/static/emoji/nerd.png";
import EmojiPat from "~/static/emoji/pat.gif";
import EmojiPatient from "~/static/emoji/patient.png";
import EmojiPride from "~/static/emoji/pride.png";
import EmojiRose from "~/static/emoji/rose.png";
import EmojiThink from "~/static/emoji/think.png";
import EmojiThumbsup from "~/static/emoji/thumbsup.png";
import EmojiYonk from "~/static/emoji/yonk.png";
import EmojiFlirtual from "~/static/icon-color.svg?w=64&h=64&fit=contain&background=transparent&imagetools";
import EmojiDeveloper from "~/static/mascot-hardhat.png?w=64&h=64&fit=contain&background=transparent&imagetools";
import { emptyArray } from "~/utilities";

import { warnOnce } from "./use-log";
import { useOptionalSession } from "./use-session";

const TalkjsContext = createContext<TalkSession | null>(null);
const UnreadConversationContext = createContext<{
	unreadConversations: Array<ConversationSnapshot>;
	setUnreadConversations: Dispatch<SetStateAction<Array<ConversationSnapshot>>>;
}>({ unreadConversations: emptyArray, setUnreadConversations: doNothing });

function expiresAt(token: string) {
	try {
		const [, payload] = token.split(".");
		const { exp } = JSON.parse(atob(payload.replaceAll("-", "+").replaceAll("_", "/"))) as { exp: number };
		return exp * 1000;
	}
	catch {
		return 0;
	}
}

let talkjsToken: string | null = null;
let talkjsTokenExpiresAt = 0;

// `onNeedToken` must retry on its own: https://talkjs.com/docs/Data_APIs/JavaScript/TalkSession/
// `mutate(sessionKey(), …)` keeps the query fresh with a stale token, so cache by the token's expiry.
async function fetchTalkjsToken() {
	if (talkjsToken && Date.now() < talkjsTokenExpiresAt - ms("30s")) return talkjsToken;

	for (let attempt = 0; ; attempt++) {
		try {
			const session = await queryClient.fetchQuery({
				queryKey: sessionKey(),
				queryFn: sessionFetcher,
				staleTime: 0
			});

			const token = session?.user.talkjsToken;

			if (token) {
				talkjsToken = token;
				talkjsTokenExpiresAt = expiresAt(token);

				return token;
			}
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

	return session;
}

// The navigation badge stops counting at 99.
const unreadConversationLimit = 100;

const TalkjsProvider_: FC<PropsWithChildren> = ({ children }) => {
	const authSession = useOptionalSession();
	const talkjsUserId = authSession?.user.talkjsId;

	const [unreadConversations, setUnreadConversations] = useState<Array<ConversationSnapshot>>([]);

	const session = useMemo(() => talkjsUserId ? talkSession(talkjsUserId) : null, [talkjsUserId]);

	useEffect(() => {
		if (!session) return;

		const conversationSubscription = session.subscribeConversations(() => invalidate({ queryKey: conversationsKey() }));

		const unreadSubscription = session.subscribeConversations(
			{ filter: { isUnread: true } },
			(snapshot, loadedAll) => {
				setUnreadConversations(snapshot);
				if (!loadedAll && snapshot.length < unreadConversationLimit) void unreadSubscription.loadMore(30);
			}
		);

		return () => {
			unreadSubscription.unsubscribe();
			conversationSubscription.unsubscribe();
			setUnreadConversations([]);
		};
	}, [session]);

	const unreadConversationContext = useMemo(() => ({
		unreadConversations,
		setUnreadConversations
	}), [unreadConversations]);

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
	const value = useMemo(() => ({ unreadConversations: emptyArray, setUnreadConversations: doNothing }), []);

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

export function useUnreadConversations() {
	return use(UnreadConversationContext);
}

const emojis: Array<{ name: string; url: string; hidden?: boolean }> = [
	{ name: "bonk", url: EmojiBonk },
	{ name: "chad", url: EmojiChad },
	{ name: "cool", url: EmojiCool },
	{ name: "cupid", url: EmojiCupid },
	{ name: "developer", url: EmojiDeveloper },
	{ name: "dj", url: EmojiDj },
	{ name: "etto", url: EmojiEtto },
	{ name: "ew", url: EmojiEw },
	{ name: "flirtual", url: EmojiFlirtual },
	{ name: "headphones", url: EmojiHeadphones },
	{ name: "long", url: EmojiLong },
	{ name: "nerd", url: EmojiNerd },
	{ name: "pat", url: EmojiPat },
	{ name: "patient", url: EmojiPatient },
	{ name: "pride", url: EmojiPride },
	{ name: "rose", url: EmojiRose },
	{ name: "think", url: EmojiThink },
	{ name: "thumbsup", url: EmojiThumbsup },
	{ name: "yonk", url: EmojiYonk }
];

export const customEmojis = Object.fromEntries(
	emojis.map(({ name, url, hidden = false }) => [
		`:${name}:`,
		{
			url,
			hidden
		}
	])
);

export const customEmojiNames: ReadonlySet<string> = new Set(Object.keys(customEmojis));
