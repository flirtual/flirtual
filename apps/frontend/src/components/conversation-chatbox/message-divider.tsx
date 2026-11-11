// Adapted from https://github.com/talkjs/themes/blob/6140418/default/react-tsx/MessageDivider.tsx
// Copyright (c) 2025 TalkJS (Klets B.V.), MIT License: https://github.com/talkjs/themes/blob/6140418/LICENSE.md

import { userFriendlyDate } from "@talkjs/react-components";
import type { MessageDividerProps } from "@talkjs/react-components";

// Day markers only: the classic chat had no unread ("New") marker.
export function MessageDivider({ timestamp, isDayMarker, common }: MessageDividerProps) {
	if (!isDayMarker || timestamp === undefined) return null;

	return (
		<div className="mx-2 mt-5 grid grid-cols-[1fr_max-content_1fr] items-center gap-3 text-sm! text-theme-2!">
			<hr className="border-current" />
			<span>{userFriendlyDate(timestamp, common.t)}</span>
			<hr className="border-current" />
		</div>
	);
}
