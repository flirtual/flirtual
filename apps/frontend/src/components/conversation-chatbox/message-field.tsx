// Adapted from https://github.com/talkjs/themes/blob/6140418/default/react-tsx/MessageField.tsx
// Copyright (c) 2025 TalkJS (Klets B.V.), MIT License: https://github.com/talkjs/themes/blob/6140418/LICENSE.md

import { Editor, EmojiPicker, EmojiSuggestBar, MentionSuggestList } from "@talkjs/react-components";
import type { MessageFieldProps } from "@talkjs/react-components";
import { ImagePlay, MapPin, Mic, Paperclip, SendHorizontal, Smile, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import type { KlipyGif } from "~/api/klipy";
import { klipyCustomerId, klipyMessageFile, shareKlipyGif } from "~/api/klipy";
import { Button } from "~/components/button";
import { klipyAppKey } from "~/const";
import { useToast } from "~/hooks/use-toast";

import { interestQueries } from "./gif-interests";
import { GifPicker } from "./gif-picker";
import type { ThemeCustom } from "./theme";

// Shadow above only; clipping 1px inside keeps a fractional pixel from showing below.
const picker = "relative z-1 h-[350px] w-full shrink overflow-hidden shadow-brand-1 [clip-path:inset(-1rem_0_1px)]";

const iconButton = "flex size-9 shrink-0 items-center justify-center rounded-full p-2 opacity-75 hocus:opacity-100 disabled:opacity-60 [&>svg]:size-5 [&>svg:not(.fill-current)]:fill-none!";

export function MessageField({ common, referencedMessage, editor, voiceRecorder, permissions, editMessageId }: MessageFieldProps) {
	const { chatbox, conversation, currentUser, t, theme } = common;
	const { ReplyBar, VoiceRecorder, RecordingPreview } = theme;
	const { t: translate } = useTranslation();
	const toasts = useToast();
	const [gifsShown, setGifsShown] = useState(false);

	const mode = editMessageId ? "edit" : "send";
	const canEdit = mode === "edit" && !editor.atTextLimit && editor.characterCount > 0;
	const canSend = !editor.isEmpty
		&& !editor.atTextLimit
		&& !editor.sendBlocked
		&& conversation.access === "ReadWrite";

	const showEditor = !voiceRecorder && conversation.access === "ReadWrite";
	const showLocationButton = mode === "send" && editor.isEmpty && permissions.canShareLocation;
	const showAttachmentButton = mode === "send" && permissions.canShareFile;
	// Shown even when TalkJS can't detect emoji support (a blocked canvas), as the classic chat did.
	const showEmojiButton = mode === "send";
	const showRecordButton = mode === "send" && editor.isEmpty && permissions.canSendVoiceMessage;
	const showGifButton = mode === "send" && !!klipyAppKey;
	const editorButtons = [showLocationButton, showGifButton, showEmojiButton].filter(Boolean).length;

	const { people } = common.themeCustom as ThemeCustom;
	const me = people[currentUser.id];
	const them = Object.values(people).find((user) => user.talkjsId !== currentUser.id);
	const mine = new Set(me?.profile.attributes.interest);
	const theirs = new Set(them?.profile.attributes.interest);
	const gifQueries = interestQueries
		.filter(([id]) => mine.has(id) && theirs.has(id))
		.map(([, query]) => query);

	const gifPicker = useRef<HTMLDivElement>(null);
	const gifButton = useRef<HTMLButtonElement>(null);
	const emojiButton = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (!gifsShown) return;

		const onMouseDown = ({ target }: MouseEvent) => {
			if (!(target instanceof Node) || [gifPicker, gifButton, emojiButton].some(({ current }) => current?.contains(target))) return;
			setGifsShown(false);
		};

		document.addEventListener("mousedown", onMouseDown);
		return () => document.removeEventListener("mousedown", onMouseDown);
	}, [gifsShown]);

	useEffect(() => {
		if (!editor.showEmojiPicker) return;

		const onMouseDown = (event: MouseEvent) => {
			if (event.target instanceof Node && gifButton.current?.contains(event.target)) event.stopPropagation();
		};

		window.addEventListener("mousedown", onMouseDown, true);
		return () => window.removeEventListener("mousedown", onMouseDown, true);
	}, [editor.showEmojiPicker]);

	const toggleGifs = () => {
		if (!gifsShown && editor.showEmojiPicker) editor.toggleEmojiPicker();
		setGifsShown(!gifsShown);
	};

	const pickerOpenAtPress = useRef<boolean>(undefined);
	const toggleEmoji = () => {
		const wasOpen = pickerOpenAtPress.current ?? editor.showEmojiPicker;
		pickerOpenAtPress.current = undefined;
		setGifsShown(false);
		if (wasOpen === editor.showEmojiPicker) editor.toggleEmojiPicker();
	};

	const sendGif = (gif: KlipyGif, query: string) => {
		const file = klipyMessageFile(gif);
		if (!file || editor.sendBlocked) return;

		setGifsShown(false);
		if (referencedMessage) chatbox.setReferencedMessage(null);

		chatbox.sendMessage({
			text: file.url,
			referencedMessage: referencedMessage?.id,
			custom: { gifWidth: String(file.width), gifHeight: String(file.height) }
		}).then(
			() => klipyCustomerId(currentUser.id).then((customerId) => shareKlipyGif(gif.slug, query, { customerId })).catch(() => {}),
			toasts.addError
		);
	};

	return (
		<div className={twMerge("chat-message-field flex flex-col", mode === "send" ? "max-h-[calc(100%-100px)]" : "my-3")}>
			{editor.showEmojiPicker && (
				<div className={picker}>
					<EmojiPicker />
				</div>
			)}

			{gifsShown && showGifButton && showEditor && (
				<div className={picker} ref={gifPicker}>
					<GifPicker country={me?.profile.country} queries={gifQueries} userId={currentUser.id} onPick={sendGif} />
				</div>
			)}

			<EmojiSuggestBar />
			<MentionSuggestList />

			{referencedMessage && <ReplyBar common={common} referencedMessage={referencedMessage} />}

			<div className="relative z-2 w-full shrink-0 p-2.5 text-black-80! dark:text-white-20! vision:px-[25px] vision:pb-[25px] vision:text-black-80!">
				{editor.atTextLimit && (
					<div className="-mt-3 mb-2 ml-0.5 text-[75%]! opacity-50">{t.ENTRYBOX_TEXT_LIMIT}</div>
				)}

				<div className={twMerge("flex w-full items-center gap-1", mode === "edit" && "flex-col")}>
					{conversation.access === "Read" && (
						<div className="opacity-50 select-none">{t.ENTRYBOX_PLACEHOLDER_CHAT_READONLY}</div>
					)}

					{voiceRecorder?.state === "recording" && <VoiceRecorder common={common} voiceRecorder={voiceRecorder} />}
					{voiceRecorder?.state === "previewing" && <RecordingPreview common={common} voiceRecorder={voiceRecorder} />}

					{showEditor && (
						<>
							{showAttachmentButton && (
								<button
									aria-label={t.UPLOAD_SEND_FILE}
									className={iconButton}
									title={t.UPLOAD_SEND_FILE}
									type="button"
									onClick={() => editor.attachFile()}
								>
									<Paperclip />
								</button>
							)}

							<div className="relative w-full grow" style={{ "--editor-buttons": editorButtons } as CSSProperties}>
								<Editor className="chat-editor" placeholder={t.ENTRYBOX_PLACEHOLDER} />

								<div className="absolute inset-y-0 right-2 flex items-center">
									{showLocationButton && (
										<button
											aria-label={t.UPLOAD_SHARE_LOCATION}
											className={iconButton}
											title={t.UPLOAD_SHARE_LOCATION}
											type="button"
											onClick={() => editor.shareLocation()}
										>
											<MapPin />
										</button>
									)}

									{showGifButton && (
										<button
											aria-label={translate("send_gif")}
											aria-pressed={gifsShown}
											className={iconButton}
											ref={gifButton}
											title={translate("send_gif")}
											type="button"
											onClick={toggleGifs}
										>
											{gifsShown ? <X /> : <ImagePlay />}
										</button>
									)}

									{showEmojiButton && (
										<button
											aria-label={t.ARIA_INSERT_EMOJI}
											className={iconButton}
											ref={emojiButton}
											title={t.ARIA_INSERT_EMOJI}
											type="button"
											onClick={toggleEmoji}
											onPointerDown={() => (pickerOpenAtPress.current = editor.showEmojiPicker)}
										>
											{editor.showEmojiPicker ? <X /> : <Smile />}
										</button>
									)}
								</div>
							</div>

							{mode === "send" && (showRecordButton
								? (
										<button
											aria-label={t.VOICE_MESSAGE}
											className={iconButton}
											disabled={editor.sendBlocked}
											title={t.VOICE_MESSAGE}
											type="button"
											onClick={() => editor.recordVoiceMessage()}
										>
											<Mic />
										</button>
									)
								: (
										<button
											aria-label={t.SEND_BUTTON_TEXT}
											className={twMerge(iconButton, "enabled:text-theme-2! enabled:opacity-100")}
											disabled={!canSend}
											title={t.SEND_BUTTON_TEXT}
											type="button"
											onClick={() => editor.send()}
										>
											<SendHorizontal className="fill-current" />
										</button>
									))}
						</>
					)}

					{mode === "edit" && (
						<div className="ml-auto flex gap-2">
							<Button className="font-montserrat! text-xs! font-semibold! text-black-80!" kind="secondary" size="xs" onClick={() => chatbox.setEditing(null)}>{t.CANCEL}</Button>
							<Button className="font-montserrat! text-xs! font-semibold! text-white-20!" disabled={!canEdit} size="xs" onClick={() => editor.send()}>{t.SAVE}</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
