// Adapted from https://github.com/talkjs/themes/blob/6140418/default/react-tsx/ReplyBar.tsx
// Copyright (c) 2025 TalkJS (Klets B.V.), MIT License: https://github.com/talkjs/themes/blob/6140418/LICENSE.md

import type { ReplyBarProps } from "@talkjs/react-components";
import { Reply, X } from "lucide-react";

import { ReplyPreview } from "./reply-preview";

export function ReplyBar({ common, referencedMessage }: ReplyBarProps) {
	const { chatbox, t } = common;

	return (
		<div className="flex items-center gap-2 px-3 pt-2 text-sm! text-black-80! dark:text-white-20! vision:text-black-80!">
			<Reply className="size-4 shrink-0 fill-none! opacity-75" />
			<button
				className="flex min-w-0 grow cursor-pointer items-center text-left! opacity-75 hocus:opacity-100"
				type="button"
				onClick={() => chatbox.focusMessage(referencedMessage.id)}
			>
				<ReplyPreview common={common} message={referencedMessage} />
			</button>
			<button
				aria-label={t.REPLY_MODE_LEAVE_ARIA_LABEL}
				className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-75 hocus:opacity-100"
				title={t.REPLY_MODE_LEAVE_ARIA_LABEL}
				type="button"
				onClick={() => chatbox.setReferencedMessage(null)}
				// Keeps the focus in the message field.
				onMouseDown={(event) => event.preventDefault()}
			>
				<X className="size-4 fill-none!" />
			</button>
		</div>
	);
}
