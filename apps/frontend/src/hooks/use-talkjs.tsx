"use client";

import {
	type CSSProperties,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState
} from "react";
import Talk from "talkjs";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";

import { talkjsAppId } from "~/const";
import { resolveTheme } from "~/theme";

import { useSession } from "./use-session";
import { useTheme } from "./use-theme";
import { useNotifications } from "./use-notifications";
import { useDevice } from "./use-device";
import { getConversationsKey } from "./use-conversations.shared";

import type { ChatboxOptions } from "talkjs/types/talk.types";
import type React from "react";

const TalkjsContext = createContext<Talk.Session | null>(null);
const UnreadConversationContext = createContext<Array<Talk.UnreadConversation>>(
	[]
);

export const TalkjsProvider: React.FC<React.PropsWithChildren> = ({
	children
}) => {
	if (!talkjsAppId) {
		useEffect(
			() =>
				console.warn(
					"Talk.js is not configured properly, conversations & related features are disabled. To enable them, set NEXT_PUBLIC_TALKJS_APP_ID in your environment."
				),
			[]
		);

		return (
			<TalkjsContext.Provider value={null}>
				<UnreadConversationContext.Provider value={[]}>
					{children}
				</UnreadConversationContext.Provider>
			</TalkjsContext.Provider>
		);
	}

	const { platform } = useDevice();

	const [ready, setReady] = useState(false);
	const [authSession] = useSession();

	const router = useRouter();
	const { mutate } = useSWRConfig();

	const { pushRegistrationId } = useNotifications();
	const [unreadConversations, setUnreadConversations] = useState<
		Array<Talk.UnreadConversation>
	>([]);

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

const emojis: Array<{ name: string; type: "png" | "gif"; hidden?: boolean }> = [
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
	React.ComponentProps<"div"> & {
		conversationId: string | null;
	}
> = ({ conversationId, ...props }) => {
	const session = useTalkjs();
	const [element, setElement] = useState<HTMLDivElement | null>(null);

	const { sessionTheme } = useTheme();
	const { platform, native, vision } = useDevice();

	const chatbox = useMemo(() => {
		if (!session) return null;

		const dark = resolveTheme(sessionTheme) === "dark";
		const theme = vision
			? "next-noheader-vision"
			: dark
				? "next-noheader-dark"
				: "next-noheader";

		return session.createChatbox({
			theme,
			messageField: { spellcheck: true, enterSendsMessage: !native },
			customEmojis
		} as ChatboxOptions);
	}, [session, sessionTheme, native]);

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
	}, [element, platform]);

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
			data-sentry-block
			className="relative w-full overflow-hidden bg-white-20 dark:bg-black-70 vision:bg-transparent desktop:max-h-[38rem] desktop:rounded-xl desktop:pt-0 desktop:before:pointer-events-none desktop:before:absolute desktop:before:inset-0 desktop:before:z-10 desktop:before:size-full desktop:before:rounded-xl desktop:before:shadow-brand-inset desktop:before:content-['']"
			style={
				{
					height
				} as CSSProperties
			}
			{...props}
			ref={setElement}
		/>
	);
};
