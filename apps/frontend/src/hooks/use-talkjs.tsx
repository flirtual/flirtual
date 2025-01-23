/* eslint-disable react-refresh/only-export-components */
"use client";

import { useLocale, useMessages, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
	createContext,
	type CSSProperties,
	type FC,
	type PropsWithChildren,
	use,
	useEffect,
	useMemo,
	useState
} from "react";
import type React from "react";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import Talk from "talkjs";
import type { ChatboxOptions } from "talkjs/types/talk.types";

import { talkjsAppId } from "~/const";
import { resolveTheme } from "~/theme";
import { emptyArray } from "~/utilities";

import { getConversationsKey } from "./use-conversations.shared";
import { useDevice } from "./use-device";
import { warnOnce } from "./use-log";
import { useNotifications } from "./use-notifications";
import { useSession } from "./use-session";
import { useTheme } from "./use-theme";

const TalkjsContext = createContext<Talk.Session | null>(null);
const UnreadConversationContext = createContext<Array<Talk.UnreadConversation>>(
	[]
);

const TalkjsProvider_: React.FC<React.PropsWithChildren> = ({ children }) => {
	const { platform } = useDevice();

	const [ready, setReady] = useState(false);
	const [authSession] = useSession();

	const router = useRouter();
	const { mutate } = useSWRConfig();

	const { pushRegistrationId } = useNotifications();
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
		if (!session || !pushRegistrationId || authSession?.sudoerId) return;

		void (async () => {
			await session.clearPushRegistrations();
			if (authSession?.user.preferences?.pushNotifications.messages)
				await session.setPushRegistration({
					provider: platform === "apple" ? "apns" : "fcm",
					pushRegistrationId
				});
		})();
	}, [
		session,
		authSession,
		pushRegistrationId,
		platform,
		router,
		authSession?.user.preferences?.pushNotifications.messages
	]);

	useEffect(() => {
		setUnreadConversations([]);
		if (!session) return;

		const messageSubscription = session.onMessage(async () => {
			await mutate(unstable_serialize(getConversationsKey));
			router.refresh();
		});

		const unreadSubscription = session.unreads.onChange(setUnreadConversations);

		return () => {
			unreadSubscription.unsubscribe();
			messageSubscription.unsubscribe();
		};
	}, [session, router, mutate]);

	// useEffect(() => {
	// 	return () => session?.destroy();
	// }, [session]);

	return (
		<TalkjsContext.Provider value={session}>
			<UnreadConversationContext.Provider value={unreadConversations}>
				{children}
			</UnreadConversationContext.Provider>
		</TalkjsContext.Provider>
	);
};

const FallbackProvider: FC<PropsWithChildren> = ({ children }) => {
	warnOnce("Talk.js is not configured properly, conversations & related features are disabled. To enable them, set \"NEXT_PUBLIC_TALKJS_APP_ID\" in your environment.");

	return (
		<TalkjsContext.Provider value={null}>
			<UnreadConversationContext.Provider value={emptyArray}>
				{children}
			</UnreadConversationContext.Provider>
		</TalkjsContext.Provider>
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

const emojis: Array<{ name: string; type: "gif" | "png"; hidden?: boolean }> = [
	{ name: "bonk", type: "gif" },
	{ name: "chad", type: "png" },
	{ name: "cool", type: "png" },
	{ name: "cupid", type: "png" },
	{ name: "developer", type: "png" },
	{ name: "dj", type: "png" },
	{ name: "etto", type: "png" },
	{ name: "ew", type: "png" },
	{ name: "flirtual", type: "png" },
	{ name: "headphones", type: "gif" },
	{ name: "long", type: "png" },
	{ name: "nerd", type: "png" },
	{ name: "pat", type: "gif" },
	{ name: "patient", type: "png" },
	{ name: "pride", type: "png" },
	{ name: "rose", type: "png" },
	{ name: "think", type: "png" },
	{ name: "yonk", type: "png" }
];

const customEmojis = Object.fromEntries(
	emojis.map(({ name, type, hidden = false }) => [
		`:${name}:`,
		{
			url: `https://img.flirtu.al/emoji/${name}.${type}`,
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

	const { sessionTheme } = useTheme();
	const { platform, native, vision } = useDevice();
	const { talkjs_match_message, talkjs_input_placeholder } = useMessages();
	const locale = useLocale();

	const chatbox = useMemo(() => {
		if (!session) return null;

		const dark = resolveTheme(sessionTheme) === "dark";
		const theme = vision
			? "vision"
			: dark
				? "dark"
				: "light";

		return session.createChatbox({
			theme: {
				name: theme,
				custom: {
					language: locale,
					matchMessage: talkjs_match_message,
					inputPlaceholder: talkjs_input_placeholder
				}
			},
			messageField: { spellcheck: true, enterSendsMessage: !native },
			customEmojis
		} as ChatboxOptions);
	}, [session, sessionTheme, vision, locale, talkjs_match_message, talkjs_input_placeholder, native]);

	const conversation = useMemo(() => {
		if (!session || !conversationId) return null;
		return session.getOrCreateConversation(conversationId);
	}, [session, conversationId]);

	const height = useMemo(() => {
		if (!element) return "0px";
		const unit = CSS.supports("height", "100dvh") ? "dvh" : "vh";
		return vision
			? `calc(100${unit} - 8.125rem)`
			: platform === "android"
				? `calc(100${unit} - max(calc(var(--safe-area-inset-top, 0rem) + 0.5rem), 1rem) - 11.625rem)`
				: `calc(100${unit} - max(calc(env(safe-area-inset-top, 0rem) + 0.5rem), 1rem) - max(calc(env(safe-area-inset-bottom, 0rem) - 0.625rem), 0.5rem) - 11.125rem)`;
	}, [element, platform, vision]);

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
