import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import type { ProspectKind } from "~/api/matchmaking";
import type { User } from "~/api/user";
import { usePreferences } from "~/hooks/use-preferences";
import { useToast } from "~/hooks/use-toast";
import { conversationKey, invalidate } from "~/query";
import { scrollBehavior } from "~/utilities";

import { Composer } from "./composer";
import type { TextFieldHandle } from "./composer";
import { lineHeight } from "./composer-styles";
import { ChatContext, ChatStateContext } from "./context";
import type { ChatContextValue, ChatStateValue } from "./context";
import { MessageList } from "./message-list";
import { highlightMessage } from "./replying";
import { revealOffset } from "./scroll-anchor";
import { messageList } from "./selectors";
import { ComposerSkeleton } from "./skeleton";
import { ChatStore, maxMessageLength } from "./store";
import type { ChatMessage, ChatReply } from "./store";

import "./chat.css";

const scrollEndFallback = 700;
const revealGap = 16;

export interface ChatBodyProps {
	conversationId: string;
	me: User;
	participants: Array<User>;
	kind?: ProspectKind;
}

const ChatBody: FC<ChatBodyProps> = ({ conversationId, me, participants, kind }) => {
	const { t } = useTranslation();
	const toasts = useToast();
	const [fontSize] = usePreferences<number>("font_size", 16);

	const store = useMemo(() => new ChatStore(conversationId, me.id), [conversationId, me.id]);
	const state = useSyncExternalStore(store.subscribe, store.getState);

	const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
	const [editing, setEditing] = useState<string | null>(null);
	const field = useRef<TextFieldHandle>(null);

	useEffect(() => {
		store.handleErrors((reason) => {
			const message = reason === "rate_limited"
				? t("errors.message_rate_limit")
				: reason === "message_too_long"
					? t("errors.should_be_at_most_{count}_character(s)" as never, { count: maxMessageLength })
					: reason === "warning_unacknowledged"
						? t("errors.warning_unacknowledged")
						: t("errors.internal_server_error");

			toasts.add({ type: "error", value: message });
		});

		const sync = () => document.visibilityState === "visible" ? store.join() : store.leave();
		sync();
		document.addEventListener("visibilitychange", sync);

		return () => {
			document.removeEventListener("visibilitychange", sync);
			store.leave();
		};
	}, [store, t, toasts]);

	useEffect(() => {
		if (state.status === "closed") void invalidate({ queryKey: conversationKey(conversationId) });
	}, [state.status, conversationId]);

	const focusField = useCallback(() => field.current?.focus(), []);

	const reveal = useCallback(async (reply: ChatReply, from: HTMLElement) => {
		const list = from.closest("[data-chatbox]")?.querySelector<HTMLElement>(messageList);
		if (!list || !await store.reveal(reply.seq)) return;

		requestAnimationFrame(() => {
			const bubble = list.querySelector(`[data-message-id="${CSS.escape(reply.id)}"] [data-bubble]`);
			if (!bubble) return;

			const offset = revealOffset(list, bubble, revealGap);
			if (!offset) return highlightMessage(reply.id);

			let highlighted = false;
			const arrive = () => {
				if (highlighted) return;
				highlighted = true;
				highlightMessage(reply.id);
			};
			list.addEventListener("scrollend", arrive, { once: true });
			setTimeout(arrive, scrollEndFallback);
			list.scrollTo({ top: list.scrollTop + offset, behavior: scrollBehavior() });
		});
	}, [store]);

	const toggleReaction = useCallback((message: ChatMessage, emoji: string) => {
		const reacted = message.reactions.some((reaction) => reaction.emoji === emoji && reaction.userIds.includes(me.id));
		void store.react(message.id, emoji, !reacted);
	}, [store, me.id]);

	const participant = participants.find(({ id }) => id !== me.id);

	const { readOnly } = state;

	const value = useMemo<ChatContextValue>(() => ({
		store,
		conversationId,
		me,
		people: Object.fromEntries([me, ...participants].map((user) => [user.id, user])),
		match: kind && participant && !readOnly ? { kind, me, participant } : undefined,
		readOnly,
		setReplyingTo,
		setEditing,
		focusField,
		reveal: (reply, from) => void reveal(reply, from),
		toggleReaction
	}), [store, conversationId, me, participants, participant, kind, readOnly, focusField, reveal, toggleReaction]);

	const stateValue = useMemo<ChatStateValue>(() => ({ state, replyingTo, editing }), [state, replyingTo, editing]);

	return (
		<ChatContext value={value}>
			<ChatStateContext value={stateValue}>
				<div
					data-chat
					className="flex size-full flex-col text-black-80 dark:text-white-20 vision:text-black-80"
					style={{ fontSize, "--chat-line-height": lineHeight } as React.CSSProperties}
				>
					<MessageList />
					{state.status === "ready" && !state.readOnly && (
						<Composer
							placeholder={t("talkjs_input_placeholder", { name: participant?.profile.displayName || t("unnamed_user") })}
							ref={field}
						/>
					)}
					{state.status === "connecting" && <ComposerSkeleton />}
				</div>
			</ChatStateContext>
		</ChatContext>
	);
};

export default ChatBody;
