"use client";

import React, {
	CSSProperties,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState
} from "react";
import Talk from "talkjs";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";

import { talkjsAppId } from "~/const";
import { resolveTheme } from "~/theme";
import { unstableInfiniteSerialize } from "~/components/swr";

import { useSession } from "./use-session";
import { useTheme } from "./use-theme";
import { useNotifications } from "./use-notifications";
import { useDevice } from "./use-device";
import { getConversationsKey } from "./use-conversations.shared";

const TalkjsContext = createContext<Talk.Session | null>(null);
const UnreadConversationContext = createContext<Array<Talk.UnreadConversation>>(
	[]
);

export const TalkjsProvider: React.FC<React.PropsWithChildren> = ({
	children
}) => {
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
		if (!session || !pushRegistrationId) return;

		void (async () => {
			await session.clearPushRegistrations();
			authSession?.user.preferences?.pushNotifications.messages &&
				(await session.setPushRegistration({
					provider: platform === "apple" ? "apns" : "fcm",
					pushRegistrationId
				}));
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
			await mutate(unstableInfiniteSerialize(getConversationsKey));
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
		conversationId: string | null;
	}
> = ({ conversationId, ...props }) => {
	const session = useTalkjs();
	const [element, setElement] = useState<HTMLDivElement | null>(null);

	const { sessionTheme } = useTheme();
	const { native } = useDevice();

	const chatbox = useMemo(() => {
		if (!session) return null;

		const dark = resolveTheme(sessionTheme) === "dark";
		const theme = dark ? "next-noheader-dark" : "next-noheader";

		return session.createChatbox({
			theme,
			messageField: { spellcheck: true, enterSendsMessage: !native }
		});
	}, [session, sessionTheme, native]);

	const conversation = useMemo(() => {
		if (!session || !conversationId) return null;
		return session.getOrCreateConversation(conversationId);
	}, [session, conversationId]);

	const height = useMemo(() => {
		if (!element) return "0px";
		const insetBottom = getComputedStyle(element).getPropertyValue(
			"--safe-area-inset-bottom"
		);
		const unit = CSS.supports("height", "100dvh") ? "dvh" : "vh";
		return insetBottom === "0px"
			? `calc(100${unit} - 11.75rem)`
			: `calc(100${unit} - 14.75rem - var(--safe-area-inset-bottom))`;
	}, [element]);

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
			className="w-full overflow-hidden md:max-h-[32rem] md:rounded-b-xl md:pt-0"
			style={
				{
					"--safe-area-inset-bottom": "env(safe-area-inset-bottom)",
					height
				} as CSSProperties
			}
			{...props}
			ref={setElement}
		/>
	);
};
