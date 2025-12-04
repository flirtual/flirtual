/* eslint-disable react-refresh/only-export-components */
import {
	createContext,

	use,
	useEffect,
	useMemo,
	useState
} from "react";
import type { CSSProperties, Dispatch, FC, PropsWithChildren, SetStateAction } from "react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { doNothing } from "remeda";
import Talk from "talkjs";
import type { ChatboxOptions } from "talkjs/types/talk.types";
import EmojiBonk from "virtual:remote/static/emoji/bonk.gif";
import EmojiChad from "virtual:remote/static/emoji/chad.png";
import EmojiCool from "virtual:remote/static/emoji/cool.png";
import EmojiCupid from "virtual:remote/static/emoji/cupid.png";
import EmojiDeveloper from "virtual:remote/static/emoji/developer.png";
import EmojiDj from "virtual:remote/static/emoji/dj.png";
import EmojiEtto from "virtual:remote/static/emoji/etto.png";
import EmojiEw from "virtual:remote/static/emoji/ew.png";
import EmojiFlirtual from "virtual:remote/static/emoji/flirtual.png";
import EmojiHeadphones from "virtual:remote/static/emoji/headphones.gif";
import EmojiLong from "virtual:remote/static/emoji/long.png";
import EmojiNerd from "virtual:remote/static/emoji/nerd.png";
import EmojiPat from "virtual:remote/static/emoji/pat.gif";
import EmojiPatient from "virtual:remote/static/emoji/patient.png";
import EmojiPride from "virtual:remote/static/emoji/pride.png";
import EmojiRose from "virtual:remote/static/emoji/rose.png";
import EmojiThink from "virtual:remote/static/emoji/think.png";
import EmojiThumbsup from "virtual:remote/static/emoji/thumbsup.png";
import EmojiYonk from "virtual:remote/static/emoji/yonk.png";

import { talkjsAppId } from "~/const";
import { useLocale } from "~/i18n";
import { conversationsKey, invalidate } from "~/query";
import { absoluteUrl } from "~/urls";
import { emptyArray } from "~/utilities";

import { useDevice } from "./use-device";
import { warnOnce } from "./use-log";
import { usePreferences } from "./use-preferences";
import { useOptionalSession } from "./use-session";
import { useTheme } from "./use-theme";

const TalkjsContext = createContext<Talk.Session | null>(null);
const UnreadConversationContext = createContext({} as {
	unreadConversations: Array<Talk.UnreadConversation>;
	setUnreadConversations: Dispatch<SetStateAction<Array<Talk.UnreadConversation>>>;
});

const TalkjsProvider_: React.FC<React.PropsWithChildren> = ({ children }) => {
	const [ready, setReady] = useState(false);
	const authSession = useOptionalSession();

	const [unreadConversations, setUnreadConversations] = useState<Array<Talk.UnreadConversation>>([]);

	useEffect(() => void Talk.ready.then(() => setReady(true)), []);

	const talkjsUserId = authSession?.user.talkjsId;
	const talkjsSignature = authSession?.user.talkjsSignature;

	const session = useMemo(() => {
		if (!talkjsUserId || !talkjsSignature || !ready) return null;

		return new Talk.Session({
			appId: talkjsAppId,
			signature: talkjsSignature,
			me: new Talk.User(talkjsUserId)
		});
	}, [talkjsUserId, talkjsSignature, ready]);

	useEffect(() => {
		setUnreadConversations([]);
		if (!session) return;

		const messageSubscription = session.onMessage(() => invalidate({ queryKey: conversationsKey() }));

		const unreadSubscription = session.unreads.onChange((unreadConversations) => {
			invalidate({ queryKey: conversationsKey() });
			setUnreadConversations(unreadConversations);
		});

		return () => {
			unreadSubscription.unsubscribe();
			messageSubscription.unsubscribe();
		};
	}, [session]);

	// useEffect(() => {
	// 	return () => session?.destroy();
	// }, [session]);

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
			url: absoluteUrl(url).href,
			hidden
		}
	])
);

export const ConversationChatbox: React.FC<
	{
		conversationId: string | null;
	} & React.ComponentProps<"div">
> = ({ conversationId, ...props }) => {
	const session = useTalkjs();
	const [element, setElement] = useState<HTMLDivElement | null>(null);

	const [theme] = useTheme();
	const { native, vision } = useDevice();
	const { t } = useTranslation();
	const [locale] = useLocale();
	const [fontSize] = usePreferences<number>("font_size", 16);

	const chatbox = useMemo(() => {
		if (!session) return null;

		return session.createChatbox({
			theme: {
				name: vision
					? "vision"
					: theme,
				custom: {
					language: locale,
					fontSize: `${fontSize}px`,
					matchMessage: t("talkjs_match_message"),
					inputPlaceholder: t("talkjs_input_placeholder")
				}
			},
			messageField: { spellcheck: true, enterSendsMessage: !native },
			customEmojis
		} as ChatboxOptions);
	}, [session, theme, vision, locale, fontSize, t, native]);

	const conversation = useMemo(() => {
		if (!session || !conversationId) return null;
		return session.getOrCreateConversation(conversationId);
	}, [session, conversationId]);

	const height = useMemo(() => {
		if (!element) return "0px";
		const unit = CSS.supports("height", "100dvh") ? "dvh" : "vh";
		return vision
			? `calc(100${unit} - 8.125rem)`
			: `calc(100${unit} - max(calc(var(--safe-area-inset-top, 0rem) + 0.5rem), 1rem) - max(calc(var(--safe-area-inset-bottom, 0rem) - 0.25rem), 0.5rem) - 11.125rem)`;
	}, [element, vision]);

	useEffect(() => {
		if (!chatbox || !conversation) return;
		void chatbox.select(conversation);
	}, [chatbox, conversation]);

	useEffect(() => {
		if (!element) return;

		void chatbox?.mount(element);
		return () => chatbox?.destroy();
	}, [chatbox, element]);

	return (
		<div
			data-block
			style={
				{
					height
				} as CSSProperties
			}
			className="relative w-full overflow-hidden bg-white-20 vision:bg-transparent dark:bg-black-70 desktop:max-h-[38rem] desktop:rounded-xl desktop:pt-0 desktop:before:pointer-events-none desktop:before:absolute desktop:before:inset-0 desktop:before:z-10 desktop:before:size-full desktop:before:rounded-xl desktop:before:shadow-brand-inset desktop:before:content-['']"
			{...props}
			ref={setElement}
		/>
	);
};
