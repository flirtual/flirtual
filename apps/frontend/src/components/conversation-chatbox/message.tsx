// Adapted from https://github.com/talkjs/themes/blob/6140418/default/react-tsx/Message.tsx
// Copyright (c) 2025 TalkJS (Klets B.V.), MIT License: https://github.com/talkjs/themes/blob/6140418/LICENSE.md

import { Haptics, ImpactStyle } from "@capacitor/haptics";
import {
	getPhotoUrlWithFallback,
	MessageContent,
	PopoverButton,
	ReactionPicker,
	useReactions
} from "@talkjs/react-components";
import type { MessageProps, ReactionsSummarySnapshot } from "@talkjs/react-components";
import { Copy, Link2, Pencil, Reply, SmilePlus, TextSelect, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { isKlipyMedia } from "~/api/embed";
import { Link } from "~/components/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useCopy } from "~/hooks/use-copy";
import { useDevice } from "~/hooks/use-device";
import { customEmojiNames } from "~/hooks/use-talkjs";
import { urls } from "~/urls";

import { isJumboEmoji, splitEmoji } from "./custom-emoji";
import { Emoji } from "./emoji";
import { countEmojiUse, frequentReactions } from "./emoji-favorites";
import { soleLink } from "./links";
import { MatchCard } from "./match-card";
import { isMatchMessage } from "./match-message";
import { nearSelection, replyDistance, useMessageGesture } from "./message-gesture";
import type { MessageMenuItem } from "./message-menu";
import { MessageMenu } from "./message-menu";
import { useBeingRepliedTo } from "./replying";
import type { ThemeCustom } from "./theme";

type Sender = "currentUser" | "other" | "system";

const surface = {
	currentUser: "bg-brand-gradient text-white-10!",
	other: "bg-white-30 text-black-80! dark:bg-black-60 dark:text-white-20! vision:bg-white-30/70 vision:text-black-80!",
	system: "bg-white-30 text-black-50! dark:bg-black-60 dark:text-white-20! vision:bg-white-30/70 vision:text-black-50!"
} satisfies Record<Sender, string>;

const highlightedBare = {
	currentUser: "text-white-10! before:bg-brand-gradient dark:text-white-10! vision:text-white-10!",
	other: "before:bg-white-30 dark:before:bg-black-60 vision:before:bg-white-30",
	system: "before:bg-white-30 dark:before:bg-black-60 vision:before:bg-white-30"
} satisfies Record<Sender, string>;

// A jumbo emoji or GIF message has no bubble, so its timestamp sits on the chat background.
const bareSurface = "text-black-80! dark:text-white-20! vision:text-black-80!";
const jumboSurface = twMerge(bareSurface, "[&_img]:size-12");

const hoverButton = "flex size-7 items-center justify-center rounded-full text-black-80! opacity-75 hocus:opacity-100 dark:text-white-20! vision:text-black-80! [&>svg]:size-5 [&>svg]:fill-none!";
const chip = "flex items-center rounded-2xl px-2 py-1 shadow-brand-1 hocus:bg-brand-gradient hocus:text-white-10!";
const frequentEmojiCount = 6;
const revealMargin = 8;
const letGoDelay = 500;

export function Message({ message, messageStatus, permissions, common }: MessageProps) {
	const { currentUser, theme, conversation, t } = common;
	const { Avatar, ReferencedMessage, TimeAgo } = theme;
	const { match, people } = common.themeCustom as ThemeCustom;
	const root = useRef<HTMLDivElement>(null);
	const bubble = useRef<HTMLDivElement>(null);
	const { t: translate } = useTranslation();
	const copy = useCopy();
	const { android } = useDevice();
	const [menu, setMenu] = useState<{ container: Element; frequent: Array<string>; link: string | null } | null>(null);
	const pressedLink = useRef<string | null>(null);
	const [selecting, setSelecting] = useState(false);
	const repliedTo = useBeingRepliedTo(message.id);

	const sender: Sender = !message.sender
		? "system"
		: message.sender.id === currentUser.id ? "currentUser" : "other";

	const hasThumbnail = message.content.some((block) =>
		block.type === "location" || (block.type === "file" && block.subtype === "image"));

	const [firstBlock] = message.content;
	const jumbo = message.content.length === 1
		&& firstBlock.type === "text"
		&& isJumboEmoji(splitEmoji(firstBlock.children, customEmojiNames));

	const gifLink = message.content.length === 1 && firstBlock.type === "text" ? soleLink(firstBlock.children) : null;
	const gif = !!gifLink && isKlipyMedia(gifLink);
	const bare = jumbo || gif;

	const sent = messageStatus !== "sending";
	const canAddReaction = sent && permissions.canAddReaction && conversation.access === "ReadWrite";
	const canReply = sent && sender !== "system" && permissions.canReplyToMessage;
	const canEdit = sent && permissions.canEditMessage;
	const canDelete = sent && permissions.canDeleteMessage;
	const hasActions = canAddReaction || canReply || canEdit || canDelete;
	const hasText = message.content.some((block) => block.type === "text");

	const reply = () => {
		common.chatbox.setReferencedMessage(message.id);
		common.chatbox.focusMessageField();
	};

	const { distance, handlers } = useMessageGesture({
		onHold: (hasActions || hasText) && !selecting
			? () => {
					const container = root.current?.closest("[data-chatbox]");
					if (!container) return;

					void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
					void frequentReactions(common.t.locale, frequentEmojiCount).then((frequent) => setMenu({ container, frequent, link: pressedLink.current }));
				}
			: undefined,
		onReply: canReply && !selecting ? reply : undefined
	});

	// Keeps the replied-to message in view as the reply bar and keyboard shrink the chat.
	useEffect(() => {
		const list = root.current?.closest<HTMLElement>(".t-message-list");
		const element = bubble.current;
		if (!repliedTo || !list || !element) return;

		const reveal = () => {
			const view = list.getBoundingClientRect();
			const { top, bottom, height } = element.getBoundingClientRect();
			if (top < view.top + revealMargin || height > view.height - revealMargin * 2) list.scrollTop += top - view.top - revealMargin;
			else if (bottom > view.bottom - revealMargin) list.scrollTop += bottom - view.bottom + revealMargin;
		};

		const resizes = new ResizeObserver(reveal);
		resizes.observe(list);
		const stop = () => {
			resizes.disconnect();
			window.clearTimeout(timer);
			list.removeEventListener("touchstart", stop);
			list.removeEventListener("wheel", stop);
		};
		const timer = window.setTimeout(stop, 1500);
		list.addEventListener("touchstart", stop, { passive: true });
		list.addEventListener("wheel", stop, { passive: true });
		return stop;
	}, [repliedTo]);

	useEffect(() => {
		const content = bubble.current?.querySelector(".t-message-content");
		if (!selecting || !content) return;

		const letGo = () => {
			const selection = getSelection();
			return !selection || selection.isCollapsed || !content.contains(selection.anchorNode);
		};

		let cancelled = false;
		void Promise.all(bubble.current?.getAnimations().map(({ finished }) => finished) ?? [])
			.catch(() => {})
			.then(() => !cancelled && getSelection()?.selectAllChildren(content));

		// Making the text unselectable loses the selection for good.
		let timer: number | undefined;
		const onSelectionChange = () => {
			window.clearTimeout(timer);
			if (letGo()) timer = window.setTimeout(() => letGo() && setSelecting(false), letGoDelay);
		};

		// WebKit sends a tap as a click, which clears the selection.
		const onMouseDown = (event: MouseEvent) => {
			if (event.target instanceof Node && content.contains(event.target)) event.preventDefault();
		};
		const onPointerDown = (event: PointerEvent) => {
			if (event.target instanceof Node && content.contains(event.target)) return;
			if (nearSelection(event.clientX, event.clientY)) return;
			getSelection()?.removeAllRanges();
			setSelecting(false);
		};

		document.addEventListener("selectionchange", onSelectionChange);
		document.addEventListener("mousedown", onMouseDown, { capture: true });
		document.addEventListener("pointerdown", onPointerDown, { capture: true });
		return () => {
			window.clearTimeout(timer);
			cancelled = true;
			document.removeEventListener("selectionchange", onSelectionChange);
			document.removeEventListener("mousedown", onMouseDown, { capture: true });
			document.removeEventListener("pointerdown", onPointerDown, { capture: true });
		};
	}, [selecting]);

	const link = menu?.link;
	const menuItems: Array<MessageMenuItem> = [
		...canReply ? [{ label: translate("reply"), icon: <Reply />, onSelect: reply }] : [],
		...hasText ? [{ label: translate("copy"), icon: <Copy />, onSelect: () => void copy(message.plaintext) }] : [],
		...link ? [{ label: translate("copy_link"), icon: <Link2 />, onSelect: () => void copy(link) }] : [],
		...hasText && !bare && !android ? [{ label: translate("select_text"), icon: <TextSelect />, onSelect: () => setSelecting(true) }] : [],
		...canEdit ? [{ label: translate("edit"), icon: <Pencil />, onSelect: () => common.chatbox.setEditing(message.id) }] : [],
		...canDelete ? [{ label: translate("delete"), icon: <Trash2 />, destructive: true, onSelect: () => void common.chatbox.deleteMessage(message.id) }] : []
	];

	const action = (label: string, icon: React.ReactNode, onClick: () => void, className?: string) => (
		<button
			aria-label={label}
			className={twMerge(hoverButton, className)}
			title={label}
			type="button"
			onClick={onClick}
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
			// The focus trap's initial focus scrolls the chat.
			initialFocus={false as unknown as string}
			popoverComponent={ReactionPicker}
			popoverProps={{ messageId: message.id }}
		>
			<SmilePlus className="size-5 fill-none!" />
		</PopoverButton>
	);

	if (match && isMatchMessage(message)) return <MatchCard match={match} message={message} />;

	return (
		<>
			<div
				className={twMerge("chat-message group/message mt-2 w-full touch-pan-y touch-callout-none", selecting && "touch-callout-default")}
				ref={root}
				{...handlers}
				data-focused={common.focusedMessage?.id === message.id ? "" : undefined}
				data-reply={message.referencedMessage ? "" : undefined}
				data-sender={sender}
				onPointerDownCapture={({ target }) => {
					pressedLink.current = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]")?.href ?? null : null;
				}}
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
							"relative flex max-w-[calc(100%-3.5rem)] min-w-0 flex-col",
							!distance && "transition-transform",
							sender === "currentUser" ? "items-end" : "items-start",
							sender === "system" && "w-full max-w-full",
							hasThumbnail && "w-[calc(100%-3.5rem)]"
						)}
						style={distance ? { transform: `translateX(${distance}px)` } : undefined}
					>
						{distance > 0 && (
							<Reply
								style={{
									left: `${-distance / 2 - 12}px`,
									opacity: Math.min(distance / replyDistance, 1)
								}}
								className="absolute top-1/2 size-6 -translate-y-1/2 fill-none! text-black-80! dark:text-white-20! vision:text-black-80!"
							/>
						)}
						{hasActions && (
							<div className={twMerge("pointer-events-none absolute -top-5 z-1 flex gap-0.5 rounded-full bg-white-20 p-0.5 opacity-0 shadow-brand-1 transition-opacity group-hover/message:pointer-events-auto group-hover/message:opacity-100 group-data-reply/message:-top-9 group-data-reply/message:after:absolute group-data-reply/message:after:inset-x-0 group-data-reply/message:after:top-full group-data-reply/message:after:h-2 focus-within:pointer-events-auto focus-within:opacity-100 has-[[t-popover-content]]:pointer-events-auto has-[[t-popover-content]]:opacity-100 dark:bg-black-50 vision:bg-white-20", sender === "currentUser" ? "right-2" : "left-2")}>
								{canReply && action(translate("reply"), <Reply />, reply)}
								{canAddReaction && message.reactions.length === 0 && addReaction(hoverButton)}
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
								"relative flow-root max-w-full rounded-2xl leading-(--t-line-height-base)! break-words transition-[translate] [&_.t-message-content]:contents [&_a]:text-inherit! [&_a]:underline",
								selecting && "[&_.t-message-content]:select-text [&_.t-message-content_*]:select-text",
								repliedTo && "focused",
								jumbo ? jumboSurface : gif ? bareSurface : twMerge("px-4 py-3 shadow-brand-1", surface[sender]),
								sender === "system" && "w-full text-[120%]! italic [&:lang(ja)]:not-italic [&:lang(ko)]:not-italic [&:lang(ru)]:not-italic",
								hasThumbnail && "w-full",
								menu && bare && twMerge("before:absolute before:-inset-x-2 before:-top-2 before:-bottom-0.5 before:-z-1 before:rounded-2xl before:shadow-brand-1", highlightedBare[sender])
							)}
							ref={bubble}
						>
							<MessageContent common={common} message={message} messageStatus={messageStatus} />

							{message.editedAt !== null && (
								<span className="text-[0.74em]! whitespace-nowrap opacity-75">{` (${t.EDITED_INDICATOR})`}</span>
							)}

							<span className={twMerge("float-right mt-[0.3rem] -mb-3 ml-6 text-[0.74em]! leading-[2.2em]! opacity-75 select-none", bare && "float-none my-0 ml-0 block text-left! group-data-[sender=currentUser]/message:text-right!")}>
								<TimeAgo common={common} timestamp={message.createdAt} />
							</span>

						</div>

						{message.reactions.length > 0 && (
							<div className={twMerge("mt-2 flex flex-wrap gap-1", bare && "mt-0")}>
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

			{/* Outside the message, so it doesn't receive the menu's touches. */}
			{menu && (
				<MessageMenu
					reactions={canAddReaction
						? {
								messageId: message.id,
								emoji: menu.frequent,
								reacted: new Set(message.reactions.filter(({ currentUserReacted }) => currentUserReacted).map(({ emoji }) => emoji)),
								moreLabel: t.ADD_REACTION,
								onReact: (emoji) => {
									const adding = !message.reactions.some((summary) => summary.emoji === emoji && summary.currentUserReacted);
									void common.chatbox.toggleReaction(message.id, emoji).then(() => {
										if (adding) void countEmojiUse(common.t.locale, emoji);
									});
								}
							}
						: undefined}
					align={sender === "currentUser" ? "end" : "start"}
					bubble={bubble}
					container={menu.container}
					items={menuItems}
					padding={bare ? 8 : 0}
					onClose={() => setMenu(null)}
				/>
			)}
		</>
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

	const [tooltipOpen, setTooltipOpen] = useState(false);
	const longPress = useRef<number>(undefined);
	const longPressed = useRef(false);
	const cancelLongPress = () => window.clearTimeout(longPress.current);
	useEffect(() => cancelLongPress, []);

	return (
		<Tooltip open={tooltipOpen && names.length > 0} touchable={false} onOpenChange={setTooltipOpen}>
			<TooltipTrigger asChild>
				<button
					aria-label={t.ARIA_REACTION_COUNT(count, emoji)}
					aria-pressed={currentUserReacted}
					className={twMerge(chip, currentUserReacted ? surface.currentUser : surface.other)}
					disabled={disabled}
					type="button"
					onClick={() => {
						if (longPressed.current) longPressed.current = false;
						else chatbox.toggleReaction(messageId, emoji);
					}}
					onMouseOver={subscribe}
					onPointerCancel={cancelLongPress}
					onPointerDown={(event) => {
						longPressed.current = false;
						if (event.pointerType !== "touch") return;

						cancelLongPress();
						longPress.current = window.setTimeout(() => {
							longPressed.current = true;
							setTooltipOpen(true);
						}, 300);
					}}
					onPointerUp={cancelLongPress}
					onTouchStart={subscribe}
				>
					<Emoji className="size-5" text={emoji} />
					{count > 1 && <span className="p-1 text-[0.85rem]!">{count}</span>}
				</button>
			</TooltipTrigger>
			<TooltipContent className="max-w-60 text-sm">{names.join(", ")}</TooltipContent>
		</Tooltip>
	);
}
