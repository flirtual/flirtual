// Adapted from https://github.com/talkjs/themes/blob/6140418/default/react-tsx/ReferencedMessage.tsx
// Copyright (c) 2025 TalkJS (Klets B.V.), MIT License: https://github.com/talkjs/themes/blob/6140418/LICENSE.md

import type { ReferencedMessageProps } from "@talkjs/react-components";
import { Reply } from "lucide-react";

import { ReplyPreview } from "./reply-preview";

// One muted line above the bubble, starting where the message text does (inside its 1rem padding).
export function ReferencedMessage({ referencedMessage, common }: ReferencedMessageProps) {
	return (
		<button
			className="mb-1 flex w-0 min-w-full cursor-pointer items-center gap-1 pl-4 text-[0.85em]! text-black-80! opacity-75 dark:text-white-20! hocus:opacity-100 vision:text-black-80!"
			type="button"
			onClick={() => common.chatbox.focusMessage(referencedMessage.id)}
		>
			<Reply className="size-4 shrink-0 fill-none! opacity-75" />
			<ReplyPreview common={common} message={referencedMessage} />
		</button>
	);
}
