import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Copy, Link2, Pencil, Reply, RotateCw, SmilePlus, TextSelect, Trash2 } from "lucide-react";
import type { FC, ReactNode } from "react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { isKlipyMedia } from "~/api/embed";
import { Link } from "~/components/link";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { UserAvatar } from "~/components/user-avatar";
import { useCopy } from "~/hooks/use-copy";
import { useDevice } from "~/hooks/use-device";
import { useLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";
import { urls } from "~/urls";

import { EditField } from "./composer";
import { useChat } from "./context";
import { isJumboEmoji, splitEmoji } from "./custom-emoji";
import { customEmojiNames } from "./custom-emojis";
import { Emoji } from "./emoji";
import { countEmojiUse, frequentEmojiCount, frequentReactions } from "./emoji-favorites";
import { pickerLocale } from "./emoji-locale";
import { EmojiPicker } from "./emoji-picker";
import { soleLink } from "./links";
import { parseMarkup } from "./markup";
import { MatchCard } from "./match-card";
import { nearSelection, useMessageGesture } from "./message-gesture";
import type { MessageMenuItem } from "./message-menu";
import { MessageMenu } from "./message-menu";
import { ReferencedMessage } from "./reply";
import { useBeingRepliedTo, useHighlighted } from "./replying";
import { revealOffset } from "./scroll-anchor";
import { messageList } from "./selectors";
import type { ChatMessage, ChatReaction } from "./store";
import { MessageText } from "./text";

type Sender = "currentUser" | "other" | "system";

const surface = {
	currentUser: "bg-brand-gradient text-white-10",
	other: "bg-white-30 text-black-80 dark:bg-black-60 dark:text-white-20 vision:bg-white-30/70 vision:text-black-80",
	system: "bg-white-30 text-black-50 dark:bg-black-60 dark:text-white-20 vision:bg-white-30/70 vision:text-black-50"
} satisfies Record<Sender, string>;

const highlightedBare = {
	currentUser: "text-white-10 before:bg-brand-gradient dark:text-white-10 vision:text-white-10",
	other: "before:bg-white-30 dark:before:bg-black-60 vision:before:bg-white-30",
	system: "before:bg-white-30 dark:before:bg-black-60 vision:before:bg-white-30"
} satisfies Record<Sender, string>;

// A jumbo emoji or GIF message has no bubble, so its timestamp sits on the chat background.
const bareSurface = "text-black-80 dark:text-white-20 vision:text-black-80";
const jumboSurface = twMerge(bareSurface, "[&_img]:size-12");
const gifSurface = twMerge(bareSurface, "[&_img]:mt-0");

const hoverButton = "flex size-7 cursor-pointer items-center justify-center rounded-full text-black-80 opacity-75 hocus:opacity-100 dark:text-white-20 vision:text-black-80 [&>svg]:size-5 [&>svg]:fill-none!";
const chip = "flex cursor-pointer items-center rounded-2xl px-2 py-1 shadow-brand-1 hocus:bg-brand-gradient hocus:text-white-10 disabled:cursor-default";
const revealMargin = 8;
const letGoDelay = 500;

const ReactionPickerButton: FC<{ className: string; onPick: (emoji: string) => void }> = ({ className, onPick }) => {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button aria-label={t("add_reaction")} className={className} title={t("add_reaction")} type="button">
					<SmilePlus className="size-5 fill-none!" />
				</button>
			</PopoverTrigger>
			<PopoverContent
				data-chat-popover
				className="h-[min(320px,var(--radix-popover-content-available-height))] w-[min(352px,calc(100vw-1rem))] overflow-hidden rounded-2xl shadow-brand-1"
				sideOffset={4}
				onOpenAutoFocus={(event) => event.preventDefault()}
			>
				<EmojiPicker
					kind="reaction"
					onPick={(emoji) => {
						setOpen(false);
						onPick(emoji);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
};

const ReactionButton: FC<{ reaction: ChatReaction; disabled: boolean; onToggle: () => void }> = ({ reaction: { emoji, userIds }, disabled, onToggle }) => {
	const { t } = useTranslation();
	const { me, people } = useChat();
	const [locale] = useLocale();
	const reacted = userIds.includes(me.id);

	const names = userIds.map((id) => people[id]?.profile.displayName || t("unnamed_user"));
	const nameList = new Intl.ListFormat(intlLocale(locale), { style: "long", type: "conjunction" }).format(names);

	const [tooltipOpen, setTooltipOpen] = useState(false);
	const longPress = useRef<number>(undefined);
	const longPressed = useRef(false);
	const cancelLongPress = () => window.clearTimeout(longPress.current);
	useEffect(() => cancelLongPress, []);

	return (
		<Tooltip open={tooltipOpen && names.length > 0} touchable={false} onOpenChange={setTooltipOpen}>
			<TooltipTrigger asChild>
				<button
					aria-label={`${emoji} ${userIds.length}`}
					aria-pressed={reacted}
					className={twMerge(chip, reacted ? surface.currentUser : surface.other)}
					disabled={disabled}
					type="button"
					onClick={() => {
						if (longPressed.current) longPressed.current = false;
						else onToggle();
					}}
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
				>
					<Emoji className="size-5" text={emoji} />
					{userIds.length > 1 && <span className="p-1 text-[0.85rem]">{userIds.length}</span>}
				</button>
			</TooltipTrigger>
			<TooltipContent className="max-w-60 text-sm">{nameList}</TooltipContent>
		</Tooltip>
	);
};

const Time: FC<{ value: string }> = ({ value }) => {
	const [locale] = useLocale();
	const date = new Date(value);

	return (
		<time dateTime={value} title={new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(date)}>
			{new Intl.DateTimeFormat(intlLocale(locale), { hour: "numeric", minute: "2-digit" }).format(date)}
		</time>
	);
};

export const Message: FC<{ message: ChatMessage; first: boolean; editing: boolean }> = memo(({ message, first, editing: isEditing }) => {
	const [locale] = useLocale();
	const { store, readOnly, conversationId, me, people, match, setEditing, setReplyingTo, focusField, toggleReaction } = useChat();
	const root = useRef<HTMLDivElement>(null);
	const bubble = useRef<HTMLDivElement>(null);
	const { t } = useTranslation();
	const copy = useCopy();
	const { android } = useDevice();
	const [menu, setMenu] = useState<{ container: Element; frequent: Array<string>; link: string | null } | null>(null);
	const pressedLink = useRef<string | null>(null);
	const [selecting, setSelecting] = useState(false);
	const repliedTo = useBeingRepliedTo(message.id);
	const highlighted = useHighlighted(message.id);

	const sender: Sender = message.system || !message.senderId
		? "system"
		: message.senderId === me.id ? "currentUser" : "other";

	const nodes = useMemo(() => parseMarkup(message.text, message.links), [message.text, message.links]);
	const jumbo = isJumboEmoji(splitEmoji(nodes, customEmojiNames));
	const gifLink = soleLink(nodes);
	const gif = !!gifLink && isKlipyMedia(gifLink);
	const bare = jumbo || gif;

	const sent = !message.status;
	const writable = sent && !readOnly;
	const canAddReaction = writable && sender !== "system";
	const canReply = writable && sender !== "system";
	const canEdit = writable && sender === "currentUser" && !gif;
	const canDelete = writable && sender === "currentUser";
	const hasActions = canAddReaction || canReply || canEdit || canDelete;

	const reply = () => {
		setReplyingTo(message);
		focusField();
	};

	const remove = () => void store.remove(message.id);

	const react = (emoji: string) => {
		const adding = !message.reactions.some((reaction) => reaction.emoji === emoji && reaction.userIds.includes(me.id));
		toggleReaction(message, emoji);
		if (adding) void countEmojiUse(pickerLocale(locale), emoji);
	};

	const { sliding, handlers } = useMessageGesture({
		root,
		movesAvatar: sender === "currentUser",
		onHold: sent && !selecting && !isEditing
			? () => {
					const container = root.current?.closest("[data-chatbox]");
					if (!container) return;

					void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
					void frequentReactions(pickerLocale(locale), frequentEmojiCount).then((frequent) => setMenu({ container, frequent, link: pressedLink.current }));
				}
			: undefined,
		onReply: canReply && !selecting && !isEditing ? reply : undefined
	});

	// Keeps the replied-to message in view as the reply bar and keyboard shrink the chat.
	useEffect(() => {
		const list = root.current?.closest<HTMLElement>(messageList);
		const element = bubble.current;
		if (!repliedTo || !list || !element) return;

		const reveal = () => {
			list.scrollTop += revealOffset(list, element, revealMargin);
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
		const content = bubble.current?.querySelector("[data-message-content]");
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

	if (message.kind === "match" && match)
		return <MatchCard match={match} message={message} />;

	const link = menu?.link;
	const menuItems: Array<MessageMenuItem> = [
		...canReply ? [{ label: t("reply"), icon: <Reply />, onSelect: reply }] : [],
		{ label: t("copy"), icon: <Copy />, onSelect: () => void copy(message.text) },
		...link ? [{ label: t("copy_link"), icon: <Link2 />, onSelect: () => void copy(link) }] : [],
		...!bare && !android ? [{ label: t("select_text"), icon: <TextSelect />, onSelect: () => setSelecting(true) }] : [],
		...canEdit ? [{ label: t("edit"), icon: <Pencil />, onSelect: () => setEditing(message.id) }] : [],
		...canDelete ? [{ label: t("delete"), icon: <Trash2 />, destructive: true, onSelect: remove }] : []
	];

	const action = (label: string, icon: ReactNode, onClick: () => void, className?: string) => (
		<button aria-label={label} className={twMerge(hoverButton, className)} title={label} type="button" onClick={onClick}>
			{icon}
		</button>
	);

	const author = message.senderId ? people[message.senderId] : undefined;
	const avatar = author && <UserAvatar className="size-10 rounded-full shadow-brand-1" draggable={false} height={40} user={author} variant="icon" width={40} />;
	const text = message.kind === "match" ? t("talkjs_match_message") : null;

	return (
		<>
			<div
				className={twMerge("chat-message group/message w-full touch-pan-y touch-callout-none", first ? "mt-6" : "mt-2", selecting && "touch-callout-default", message.status === "sending" && "opacity-70")}
				ref={root}
				{...handlers}
				data-message-id={message.id}
				data-reply={message.replyTo ? "" : undefined}
				data-sender={sender}
				onPointerDownCapture={({ target }) => {
					pressedLink.current = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]")?.href ?? null : null;
				}}
			>
				<div className={twMerge("flex w-full items-start gap-4", sender === "currentUser" && "flex-row-reverse")}>
					{sender !== "system" && (
						<div className={twMerge("chat-avatar size-10 shrink-0 group-data-reply/message:mt-[calc(0.85em*var(--chat-line-height)+0.25rem)]", !first && "invisible")}>
							<div className="absolute">
								<div className="sticky top-[-2px] transition-transform">
									{author && (
										<Link className="block rounded-full focusable" href={urls.profile(author)} state={{ conversationId }}>
											{avatar}
										</Link>
									)}
								</div>
							</div>
						</div>
					)}

					<div
						className={twMerge(
							"relative flex max-w-[calc(100%-3.5rem)] min-w-0 flex-col",
							!sliding && "transition-transform",
							sender === "currentUser" ? "items-end" : "items-start",
							sender === "system" && "w-full max-w-full",
							isEditing && "w-full"
						)}
						style={sliding ? { transform: "translateX(var(--slide))" } : undefined}
					>
						{sliding && (
							<Reply
								className="absolute top-1/2 size-6 -translate-y-1/2 fill-none! text-black-80 dark:text-white-20 vision:text-black-80"
								style={{ left: "calc(var(--slide) / -2 - 12px)", opacity: "var(--slide-progress)" }}
							/>
						)}
						{hasActions && !isEditing && (
							<div className={twMerge("pointer-events-none absolute -top-5 z-1 flex gap-0.5 rounded-full bg-white-20 p-0.5 opacity-0 shadow-brand-1 transition-opacity group-hover/message:pointer-events-auto group-hover/message:opacity-100 group-data-reply/message:-top-9 group-data-reply/message:after:absolute group-data-reply/message:after:inset-x-0 group-data-reply/message:after:top-full group-data-reply/message:after:h-2 focus-within:pointer-events-auto focus-within:opacity-100 has-[[data-state=open]]:pointer-events-auto has-[[data-state=open]]:opacity-100 dark:bg-black-50 vision:bg-white-20", sender === "currentUser" ? "right-2" : "left-2")}>
								{canReply && action(t("reply"), <Reply />, reply)}
								{canAddReaction && message.reactions.length === 0 && <ReactionPickerButton className={hoverButton} onPick={react} />}
								{canEdit && action(t("edit"), <Pencil />, () => setEditing(message.id))}
								{canDelete && action(t("delete"), <Trash2 />, remove, "text-red-500 dark:text-red-500 vision:text-red-500")}
							</div>
						)}
						{message.replyTo && <ReferencedMessage reply={message.replyTo} />}

						{isEditing
							? <EditField message={message} />
							: (
									<div
										data-bubble
										className={twMerge(
											"relative flow-root max-w-full rounded-2xl leading-(--chat-line-height) break-words transition-[translate,box-shadow] [&_a]:text-inherit [&_a]:underline",
											selecting && "[&_[data-message-content]]:select-text [&_[data-message-content]_*]:select-text",
											(repliedTo || highlighted) && "focused",
											jumbo ? jumboSurface : gif ? gifSurface : twMerge("px-4 py-3 shadow-brand-1", surface[sender]),
											sender === "system" && "w-full text-[120%] italic [&:lang(ja)]:not-italic [&:lang(ko)]:not-italic [&:lang(ru)]:not-italic",
											menu && bare && twMerge("before:absolute before:-inset-x-2 before:-top-2 before:-bottom-0.5 before:-z-1 before:rounded-2xl before:shadow-brand-1", highlightedBare[sender])
										)}
										ref={bubble}
									>
										<div data-message-content className="contents">
											{text ?? <MessageText gif={message.gif} nodes={nodes} />}
										</div>

										{message.editedAt !== null && (
											<span className="text-[0.74em] whitespace-nowrap opacity-75">{` (${t("message_edited")})`}</span>
										)}

										<span className={twMerge("float-right mt-[0.3rem] -mb-3 ml-6 text-[0.74em] leading-[2.2em] opacity-75 select-none", bare && "float-none my-0 ml-0 block text-left group-data-[sender=currentUser]/message:text-right")}>
											<Time value={message.createdAt} />
										</span>
									</div>
								)}

						{message.status === "failed" && message.clientId && (
							<div className="mt-1 flex items-center gap-2 text-[0.85em] text-red-500">
								<span>{t("message_not_sent")}</span>
								{action(t("try_again"), <RotateCw />, () => store.retry(message.clientId!), "text-red-500 dark:text-red-500 vision:text-red-500")}
								{action(t("delete"), <Trash2 />, () => store.discard(message.clientId!), "text-red-500 dark:text-red-500 vision:text-red-500")}
							</div>
						)}

						{message.reactions.length > 0 && (
							<div className={twMerge("mt-2 flex flex-wrap gap-1", bare && "mt-0")}>
								{message.reactions.map((reaction) => (
									<ReactionButton key={reaction.emoji} disabled={!canAddReaction} reaction={reaction} onToggle={() => react(reaction.emoji)} />
								))}
								{canAddReaction && <ReactionPickerButton className={twMerge(chip, surface.other)} onPick={react} />}
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
								emoji: menu.frequent,
								reacted: new Set(message.reactions.filter(({ userIds }) => userIds.includes(me.id)).map(({ emoji }) => emoji)),
								moreLabel: t("add_reaction"),
								onReact: react
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
});

Message.displayName = "Message";
