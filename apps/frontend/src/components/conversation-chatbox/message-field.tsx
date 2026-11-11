// Adapted from https://github.com/talkjs/themes/blob/6140418/default/react-tsx/MessageField.tsx
// Copyright (c) 2025 TalkJS (Klets B.V.), MIT License: https://github.com/talkjs/themes/blob/6140418/LICENSE.md

import { Editor, EmojiPicker, EmojiSuggestBar, MentionSuggestList } from "@talkjs/react-components";
import type { MessageFieldProps } from "@talkjs/react-components";
import { MapPin, Mic, Paperclip, SendHorizontal, Smile, X } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { Button } from "~/components/button";

const iconButton = "flex size-9 shrink-0 items-center justify-center rounded-full p-2 opacity-75 hocus:opacity-100 disabled:opacity-60 [&>svg]:size-5 [&>svg:not(.fill-current)]:fill-none!";

export function MessageField({ common, referencedMessage, editor, voiceRecorder, permissions, editMessageId }: MessageFieldProps) {
	const { chatbox, conversation, t, theme } = common;
	const { ReplyBar, VoiceRecorder, RecordingPreview } = theme;

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

	return (
		<div className={twMerge("chat-message-field flex flex-col", mode === "send" ? "max-h-[calc(100%-100px)]" : "my-3")}>
			{editor.showEmojiPicker && (
				<div className="h-[350px] w-full shrink overflow-hidden">
					<EmojiPicker />
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

							<div className="relative w-full grow">
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

									{showEmojiButton && (
										<button
											aria-label={t.ARIA_INSERT_EMOJI}
											className={iconButton}
											title={t.ARIA_INSERT_EMOJI}
											type="button"
											onClick={() => editor.toggleEmojiPicker()}
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
							<Button kind="secondary" size="xs" onClick={() => chatbox.setEditing(null)}>{t.CANCEL}</Button>
							<Button disabled={!canEdit} size="xs" onClick={() => editor.send()}>{t.SAVE}</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
