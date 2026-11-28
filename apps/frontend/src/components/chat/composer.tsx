import { ImagePlay, SendHorizontal, Smile, X } from "lucide-react";
import type { FC, KeyboardEvent, Ref } from "react";
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import type { KlipyGif } from "~/api/klipy";
import { klipyCustomerId, klipyMessageFile, klipyNotificationFile, shareKlipyGif } from "~/api/klipy";
import { Button } from "~/components/button";
import { klipyAppKey } from "~/const";
import { useBackButton } from "~/hooks/use-back-button";
import { useDevice } from "~/hooks/use-device";
import { invalidate } from "~/query";
import { opensKeyboard } from "~/utilities";

import { composerPadding, iconButton, input, inputHeight } from "./composer-styles";
import { useChat, useChatState } from "./context";
import { render, selectedText, selectionOffsets, serialize, setCaret, stale } from "./editable";
import { EmojiPicker } from "./emoji-picker";
import { EmojiSuggestions, suggestionQuery, useEmojiSuggestions } from "./emoji-suggestions";
import { interestQueries } from "./gif-interests";
import { GifPicker } from "./gif-picker";
import { ReplyBar } from "./reply";
import { maxMessageLength } from "./store";
import type { ChatMessage } from "./store";

const counterThreshold = 9000;

const Counter: FC<{ length: number }> = ({ length }) => length > counterThreshold && (
	<div className="mb-1 flex justify-end px-1 font-nunito text-sm text-black-60 tabular-nums dark:text-white-50">
		{length}
		{" / "}
		{maxMessageLength}
	</div>
);

// Shadow above only; clipping 1px inside keeps a fractional pixel from showing below.
const picker = "relative z-1 h-[350px] w-full shrink overflow-hidden shadow-brand-1 [clip-path:inset(-1rem_0_1px)]";

const drafts = new Map<string, string>();

export interface TextFieldHandle {
	focus: () => void;
	insert: (text: string, replace?: { from: number; to: number }) => void;
	caret: () => number;
}

const TextField: FC<{
	ref?: Ref<TextFieldHandle>;
	value: string;
	placeholder?: string;
	buttons?: number;
	onChange: (value: string) => void;
	onSubmit: () => void;
	onCancel?: () => void;
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => boolean;
	onCaret?: (position: number) => void;
}> = ({ ref, value, placeholder, buttons = 0, onChange, onSubmit, onCancel, onKeyDown, onCaret }) => {
	const { native } = useDevice();
	const element = useRef<HTMLDivElement>(null);
	const selection = useRef({ from: value.length, to: value.length });
	const composing = useRef(false);

	const moveCaret = (position: number) => {
		selection.current = { from: position, to: position };
		onCaret?.(position);
	};

	useLayoutEffect(() => {
		const field = element.current;
		if (!field) return;

		try {
			field.contentEditable = "plaintext-only";
		}
		catch {
			field.contentEditable = "true";
		}
	}, []);

	useLayoutEffect(() => {
		const field = element.current;
		if (!field || composing.current || !stale(field, value)) return;

		const position = Math.min(selection.current.to, value.length);
		render(field, value);
		if (document.activeElement === field) setCaret(field, position);
	}, [value]);

	useEffect(() => {
		const onSelectionChange = () => {
			const field = element.current;
			const offsets = field && selectionOffsets(field);
			if (!offsets) return;

			selection.current = offsets;
			onCaret?.(offsets.to);
		};

		document.addEventListener("selectionchange", onSelectionChange);
		return () => document.removeEventListener("selectionchange", onSelectionChange);
	}, [onCaret]);

	const replace = (text: string, range = selection.current) => {
		const next = (value.slice(0, range.from) + text + value.slice(range.to)).slice(0, maxMessageLength);
		moveCaret(Math.min(range.from + text.length, next.length));
		onChange(next);
	};

	const read = () => {
		const field = element.current;
		if (!field) return;

		const text = serialize(field);
		const offsets = selectionOffsets(field);
		if (offsets) selection.current = offsets;

		if (text.length > maxMessageLength) {
			const position = Math.max(Math.min((offsets?.to ?? text.length) - (text.length - value.length), value.length), 0);
			render(field, value);
			setCaret(field, position);
			return moveCaret(position);
		}

		onChange(text);
		if (offsets) onCaret?.(offsets.to);
	};

	useImperativeHandle(ref, () => ({
		focus: () => {
			const field = element.current;
			if (!field || document.activeElement === field) return;

			field.focus();
			setCaret(field, value.length);
			moveCaret(value.length);
		},
		caret: () => selection.current.to,
		insert: (text, range) => replace(text, range)
	}));

	return (
		<div
			aria-multiline
			spellCheck
			suppressContentEditableWarning
			aria-placeholder={placeholder}
			className={twMerge(input, inputHeight, "cursor-text select-text empty:before:pointer-events-none empty:before:text-black-80/50 empty:before:content-[attr(data-placeholder)] dark:empty:before:text-white-20/50")}
			data-placeholder={placeholder}
			dir="auto"
			enterKeyHint={native ? "enter" : "send"}
			ref={element}
			role="textbox"
			style={{ paddingRight: `max(1rem, ${buttons * 2.25 + 0.5}rem)` }}
			onCompositionEnd={() => {
				composing.current = false;
				read();
			}}
			onCompositionStart={() => (composing.current = true)}
			onCopy={(event) => {
				const text = element.current && selectedText(element.current);
				if (text === null) return;

				event.preventDefault();
				event.clipboardData.setData("text/plain", text);
			}}
			onCut={(event) => {
				const text = element.current && selectedText(element.current);
				if (text === null) return;

				event.preventDefault();
				event.clipboardData.setData("text/plain", text);
				replace("");
			}}
			onInput={read}
			onKeyDown={(event) => {
				if (event.nativeEvent.isComposing) return;
				if (onKeyDown?.(event)) return event.preventDefault();

				if (event.key === "Escape" && onCancel) {
					event.preventDefault();
					onCancel();
				}

				if (event.key === "Enter") {
					event.preventDefault();
					if (event.shiftKey || native) replace("\n");
					else onSubmit();
				}
			}}
			onPaste={(event) => {
				event.preventDefault();
				replace(event.clipboardData.getData("text/plain").replaceAll("\r\n", "\n"));
			}}
		/>
	);
};

export const EditField: FC<{ message: ChatMessage }> = ({ message }) => {
	const { t } = useTranslation();
	const { store, setEditing, focusField } = useChat();
	const [text, setText] = useState(message.text);
	const [saving, setSaving] = useState(false);
	const field = useRef<TextFieldHandle>(null);

	useEffect(() => field.current?.focus(), []);

	const close = () => {
		setEditing(null);
		focusField();
	};

	const trimmed = text.trim();
	const save = () => {
		if (!trimmed || saving) return;
		if (trimmed === message.text) return close();

		setSaving(true);
		void store.edit(message.id, trimmed).then((saved) => saved ? close() : setSaving(false));
	};

	return (
		<div className="my-3 flex w-full min-w-48 flex-col gap-2 text-black-80 dark:text-white-20 vision:text-black-80">
			<Counter length={text.length} />
			<TextField ref={field} value={text} onCancel={close} onChange={setText} onSubmit={save} />
			<div className="ml-auto flex gap-2">
				<Button className="font-montserrat text-xs font-semibold text-black-80" kind="secondary" size="xs" onClick={close}>{t("cancel")}</Button>
				<Button className="font-montserrat text-xs font-semibold text-white-20" disabled={!trimmed || saving} size="xs" onClick={save}>{t("save")}</Button>
			</div>
		</div>
	);
};

export const Composer: FC<{ ref?: Ref<TextFieldHandle>; placeholder: string }> = ({ ref, placeholder }) => {
	const { t } = useTranslation();
	const { native } = useDevice();
	const { store, conversationId, me, people, setReplyingTo } = useChat();
	const { replyingTo } = useChatState();

	const [text, setTextState] = useState(() => drafts.get(conversationId) ?? "");
	const [caret, setCaret] = useState(0);
	const [shownPicker, setShownPicker] = useState<"emoji" | "gif" | null>(null);
	const [suggestion, setSuggestion] = useState(0);

	const field = useRef<TextFieldHandle>(null);
	useImperativeHandle(ref, () => field.current!, []);

	useEffect(() => {
		if (!opensKeyboard()) field.current?.focus();
	}, []);

	const setText = (value: string) => {
		setTextState(value);
		setSuggestion(0);
		if (value) drafts.set(conversationId, value);
		else drafts.delete(conversationId);
	};

	const them = Object.values(people).find((user) => user.id !== me.id);
	const mine = new Set(me.profile.interests);
	const theirs = new Set(them?.profile.interests);
	const gifQueries = interestQueries.filter(([id]) => mine.has(id) && theirs.has(id)).map(([, query]) => query);

	const panel = useRef<HTMLDivElement>(null);
	const gifButton = useRef<HTMLButtonElement>(null);
	const emojiButton = useRef<HTMLButtonElement>(null);
	const emojiShown = shownPicker === "emoji";
	const gifsShown = shownPicker === "gif";

	useEffect(() => {
		if (!shownPicker) return;

		const onMouseDown = ({ target }: MouseEvent) => {
			if (!(target instanceof Node) || [panel, gifButton, emojiButton].some(({ current }) => current?.contains(target))) return;
			setShownPicker(null);
		};

		document.addEventListener("mousedown", onMouseDown);
		return () => document.removeEventListener("mousedown", onMouseDown);
	}, [shownPicker]);

	useBackButton(!!shownPicker, () => setShownPicker(null));

	const showGifButton = !!klipyAppKey;
	const trimmed = text.trim();

	const send = () => {
		if (!trimmed) return;

		store.send({ text: trimmed, replyTo: replyingTo });
		setText("");
		setReplyingTo(null);
		setShownPicker(null);
	};

	const sendGif = (gif: KlipyGif, query: string) => {
		const file = klipyMessageFile(gif);
		if (!file) return;

		setShownPicker(null);
		store.send({ text: file.url, replyTo: replyingTo, gif: { width: file.width, height: file.height, preview: klipyNotificationFile(gif)?.url } });
		setReplyingTo(null);
		void klipyCustomerId(me.id)
			.then((customerId) => shareKlipyGif(gif.slug, query, { customerId }))
			.then(() => invalidate({ predicate: ({ queryKey }) => queryKey[0] === "klipy" && queryKey[2] === "recent" }))
			.catch(() => {});
	};

	const query = suggestionQuery(text, caret);
	const [dismissed, setDismissed] = useState<string | null>(null);
	const found = useEmojiSuggestions(query?.text ?? null);
	const suggestions = query && dismissed === query.text ? [] : found;
	const suggesting = !!query && suggestions.length > 0;

	const acceptSuggestion = (emoji: string) => {
		if (!query) return;
		field.current?.insert(`${emoji} `, { from: query.from, to: caret });
	};

	return (
		<div className="chat-message-field flex max-h-[calc(100%-100px)] shrink-0 flex-col" ref={panel}>
			{emojiShown && (
				<div className={picker}>
					<EmojiPicker
						kind="field"
						onPick={(emoji) => {
							field.current?.insert(emoji);
							if (!native) field.current?.focus();
						}}
					/>
				</div>
			)}

			{gifsShown && showGifButton && (
				<div className={picker}>
					<GifPicker country={me.profile.country} queries={gifQueries} userId={me.id} onPick={sendGif} />
				</div>
			)}

			<EmojiSuggestions emoji={suggestions} selected={Math.min(suggestion, suggestions.length - 1)} onPick={acceptSuggestion} />

			<ReplyBar />

			<div className={composerPadding}>
				<Counter length={text.length} />
				<div className="flex w-full items-center gap-1">
					<div className="relative w-full grow">
						<TextField
							buttons={showGifButton ? 2 : 1}
							placeholder={replyingTo ? t("reply") : placeholder}
							ref={field}
							value={text}
							onCancel={replyingTo ? () => setReplyingTo(null) : undefined}
							onCaret={setCaret}
							onChange={setText}
							onKeyDown={(event) => {
								if (!suggesting) return false;

								if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
									const step = event.key === "ArrowRight" ? 1 : -1;
									setSuggestion((suggestion + step + suggestions.length) % suggestions.length);
									return true;
								}

								if (event.key === "Tab" || (event.key === "Enter" && !event.shiftKey)) {
									acceptSuggestion(suggestions[Math.min(suggestion, suggestions.length - 1)]!);
									return true;
								}

								if (event.key === "Escape") {
									setDismissed(query.text);
									return true;
								}

								return false;
							}}
							onSubmit={send}
						/>

						<div className="absolute inset-y-0 right-2 flex items-center">
							{showGifButton && (
								<button
									aria-label={t("send_gif")}
									aria-pressed={gifsShown}
									className={iconButton}
									ref={gifButton}
									title={t("send_gif")}
									type="button"
									onClick={() => setShownPicker(gifsShown ? null : "gif")}
								>
									{gifsShown ? <X /> : <ImagePlay />}
								</button>
							)}

							<button
								aria-label={t("insert_emoji")}
								aria-pressed={emojiShown}
								className={iconButton}
								ref={emojiButton}
								title={t("insert_emoji")}
								type="button"
								onClick={() => setShownPicker(emojiShown ? null : "emoji")}
							>
								{emojiShown ? <X /> : <Smile />}
							</button>
						</div>
					</div>

					<button
						aria-label={t("send_message")}
						className={twMerge(iconButton, "enabled:text-theme-2 enabled:opacity-100")}
						disabled={!trimmed}
						title={t("send_message")}
						type="button"
						onClick={send}
						onMouseDown={(event) => event.preventDefault()}
					>
						<SendHorizontal className="fill-current" />
					</button>
				</div>
			</div>
		</div>
	);
};
