// Adapted from https://github.com/talkjs/themes/blob/6140418/default/react-tsx/Message.tsx
// Copyright (c) 2025 TalkJS (Klets B.V.), MIT License: https://github.com/talkjs/themes/blob/6140418/LICENSE.md

import {
	getPhotoUrlWithFallback,
	MessageContent,
	PopoverButton,
	ReactionPicker,
	useReactions
} from "@talkjs/react-components";
import type { MessageProps, ReactionsSummarySnapshot } from "@talkjs/react-components";
import { Pencil, Reply, SmilePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Link } from "~/components/link";
import { customEmojiNames } from "~/hooks/use-talkjs";
import { urls } from "~/urls";

import { isJumboEmoji, splitEmoji } from "./custom-emoji";
import { Emoji } from "./emoji";
import { MatchCard } from "./match-card";
import { isMatchMessage } from "./match-message";
import { replyDistance, useMessageGesture } from "./message-gesture";
import type { ThemeCustom } from "./theme";

type Sender = "currentUser" | "other" | "system";

const surface = {
	currentUser: "bg-brand-gradient text-white-10!",
	other: "bg-white-30 text-black-80! dark:bg-black-60 dark:text-white-20! vision:bg-white-30/70 vision:text-black-80!",
	system: "bg-white-30 text-black-50! dark:bg-black-60 dark:text-white-20! vision:bg-white-30/70 vision:text-black-50!"
} satisfies Record<Sender, string>;

// A jumbo emoji message has no bubble, so its timestamp sits on the chat background.
const jumboSurface = "text-black-80! dark:text-white-20! vision:text-black-80! [&_img]:size-12";

const hoverButton = "flex size-7 items-center justify-center rounded-full text-black-80! opacity-75 hocus:opacity-100 dark:text-white-20! vision:text-black-80! [&>svg]:size-5 [&>svg]:fill-none!";
const chip = "flex items-center rounded-2xl px-2 py-1 shadow-brand-1 hocus:bg-brand-gradient hocus:text-white-10!";

export function Message({ message, messageStatus, permissions, common }: MessageProps) {
	const { currentUser, theme, conversation, t } = common;
	const { Avatar, ReferencedMessage, TimeAgo } = theme;
	const { match, people } = common.themeCustom as ThemeCustom;
	const root = useRef<HTMLDivElement>(null);
	const { t: translate } = useTranslation();
	const [actionsShown, setActionsShown] = useState(false);

	const sender: Sender = !message.sender
		? "system"
		: message.sender.id === currentUser.id ? "currentUser" : "other";

	const hasThumbnail = message.content.some((block) =>
		block.type === "location" || (block.type === "file" && block.subtype === "image"));

	const [firstBlock] = message.content;
	const jumbo = message.content.length === 1
		&& firstBlock.type === "text"
		&& isJumboEmoji(splitEmoji(firstBlock.children, customEmojiNames));

	const sent = messageStatus !== "sending";
	const canAddReaction = sent && permissions.canAddReaction && conversation.access === "ReadWrite";
	const canReply = sent && sender !== "system" && permissions.canReplyToMessage;
	const canEdit = sent && permissions.canEditMessage;
	const canDelete = sent && permissions.canDeleteMessage;
	const hasActions = canAddReaction || canReply || canEdit || canDelete;

	const reply = () => {
		common.chatbox.setReferencedMessage(message.id);
		common.chatbox.focusMessageField();
	};

	const inward = sender === "currentUser" ? -1 : 1;
	const { distance, handlers } = useMessageGesture({
		inward,
		onHold: hasActions ? () => setActionsShown(true) : undefined,
		onReply: canReply ? reply : undefined
	});

	// A long press shows the actions until the next touch elsewhere.
	useEffect(() => {
		if (!actionsShown) return;

		const hide = (event: PointerEvent) => {
			if (!root.current?.contains(event.target as Node)) setActionsShown(false);
		};

		document.addEventListener("pointerdown", hide, { capture: true });
		return () => document.removeEventListener("pointerdown", hide, { capture: true });
	}, [actionsShown]);

	const action = (label: string, icon: React.ReactNode, onClick: () => void, className?: string) => (
		<button
			aria-label={label}
			className={twMerge(hoverButton, className)}
			title={label}
			type="button"
			onClick={() => {
				setActionsShown(false);
				onClick();
			}}
		>
			{icon}
		</button>
	);

	const author = message.sender && people[message.sender.id];
	const avatar = message.sender && <Avatar common={common} photoUrl={getPhotoUrlWithFallback(message.sender)} />;

	const addReaction = (className: string) => (
		<PopoverButton
			aria-label={t.ADD_REACTION}
			className={className}
			popoverComponent={ReactionPicker}
			popoverProps={{ messageId: message.id }}
		>
			<SmilePlus className="size-5 fill-none!" />
		</PopoverButton>
	);

	if (match && isMatchMessage(message)) return <MatchCard match={match} message={message} />;

	return (
		<div
			className="chat-message group/message mt-2 w-full touch-pan-y touch-callout-none"
			ref={root}
			{...handlers}
			data-actions={actionsShown ? "" : undefined}
			data-focused={common.focusedMessage?.id === message.id ? "" : undefined}
			data-reply={message.referencedMessage ? "" : undefined}
			data-sender={sender}
		>
			<div className={twMerge("flex w-full items-start gap-4", sender === "currentUser" && "flex-row-reverse")}>

				{message.sender && (
					<div className="chat-avatar size-10 shrink-0 group-data-reply/message:mt-[calc(0.85em*var(--t-line-height-base)+0.25rem)]">
						<div className="absolute">
							<div className="sticky top-[-2px]">
								{author
									? (
											<Link className="block rounded-full focusable" href={urls.profile(author)} state={{ conversationId: conversation.id }}>
												{avatar}
											</Link>
										)
									: avatar}
							</div>
						</div>
					</div>
				)}

				<div
					className={twMerge(
						"relative flex max-w-[calc(100%-6.5rem)] min-w-0 flex-col",
						!distance && "transition-transform",
						sender === "currentUser" ? "items-end" : "items-start",
						sender === "system" && "w-full max-w-full",
						hasThumbnail && "w-[calc(100%-6.5rem)]"
					)}
					style={distance ? { transform: `translateX(${distance * inward}px)` } : undefined}
				>
					{distance > 0 && (
						<Reply
							style={{
								[sender === "currentUser" ? "right" : "left"]: `${-distance / 2 - 12}px`,
								opacity: Math.min(distance / replyDistance, 1)
							}}
							className="absolute top-1/2 size-6 -translate-y-1/2 fill-none! text-black-80! dark:text-white-20! vision:text-black-80!"
						/>
					)}
					{hasActions && (
						<div className="pointer-events-none absolute -top-5 right-2 z-1 flex gap-0.5 rounded-full bg-white-20 p-0.5 opacity-0 shadow-brand-1 transition-opacity group-hover/message:pointer-events-auto group-hover/message:opacity-100 group-data-actions/message:pointer-events-auto group-data-actions/message:opacity-100 group-data-reply/message:-top-9 focus-within:pointer-events-auto focus-within:opacity-100 has-[[t-popover-content]]:pointer-events-auto has-[[t-popover-content]]:opacity-100 dark:bg-black-50 vision:bg-white-20">
							{canAddReaction && message.reactions.length === 0 && addReaction(hoverButton)}
							{canReply && action(translate("reply"), <Reply />, reply)}
							{canEdit && action(translate("edit"), <Pencil />, () => common.chatbox.setEditing(message.id))}
							{canDelete && action(translate("delete"), <Trash2 />, () => void common.chatbox.deleteMessage(message.id), "text-red-500! dark:text-red-500! vision:text-red-500!")}
						</div>
					)}
					{message.referencedMessage && (
						<ReferencedMessage common={common} referencedMessage={message.referencedMessage} />
					)}

					<div
						data-bubble
						className={twMerge(
							"relative flow-root max-w-full rounded-2xl leading-(--t-line-height-base)! break-words [&_.t-message-content]:contents [&_a]:text-inherit! [&_a]:underline",
							jumbo ? jumboSurface : twMerge("px-4 py-3 shadow-brand-1", surface[sender]),
							sender === "system" && "w-full text-[120%]! italic [&:lang(ja)]:not-italic [&:lang(ko)]:not-italic [&:lang(ru)]:not-italic",
							hasThumbnail && "w-full"
						)}
					>
						<MessageContent common={common} message={message} messageStatus={messageStatus} />

						{message.editedAt !== null && (
							<span className="text-[0.74em]! whitespace-nowrap opacity-75">{` (${t.EDITED_INDICATOR})`}</span>
						)}

						<span className={twMerge("float-right mt-[0.3rem] -mb-3 ml-6 text-[0.74em]! leading-[2.2em]! opacity-75 select-none", jumbo && "float-none my-0 ml-0 block text-left! group-data-[sender=currentUser]/message:text-right!")}>
							<TimeAgo common={common} timestamp={message.createdAt} />
						</span>

					</div>

					{message.reactions.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1">
							{message.reactions.map((summary) => (
								<ReactionButton
									key={summary.emoji}
									common={common}
									disabled={!permissions.canAddReaction}
									messageId={message.id}
									summary={summary}
								/>
							))}
							{canAddReaction && addReaction(twMerge(chip, surface.other))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function ReactionButton({ summary, messageId, disabled, common }: {
	summary: ReactionsSummarySnapshot;
	messageId: string;
	disabled: boolean;
	common: MessageProps["common"];
}) {
	const { t, chatbox, conversation } = common;
	const { people } = common.themeCustom as ThemeCustom;
	const { t: translate } = useTranslation();
	const { emoji, count, currentUserReacted } = summary;

	const [reactions, subscribe] = useReactions(conversation.id, messageId, emoji);
	const names = reactions.map(({ user }) => {
		const person = people[user.id];
		return person ? person.profile.displayName || translate("unnamed_user") : user.name;
	});
	if (reactions.length > 0 && reactions.length < count) names.push("...");

	return (
		<button
			aria-label={t.ARIA_REACTION_COUNT(count, emoji)}
			aria-pressed={currentUserReacted}
			className={twMerge(chip, currentUserReacted ? surface.currentUser : surface.other)}
			disabled={disabled}
			t-tooltip-text={names.join(", ")}
			type="button"
			onClick={() => chatbox.toggleReaction(messageId, emoji)}
			onMouseOver={subscribe}
			onTouchStart={subscribe}
		>
			<Emoji className="size-5" text={emoji} />
			{count > 1 && <span className="p-1 text-[0.85rem]!">{count}</span>}
		</button>
	);
}
