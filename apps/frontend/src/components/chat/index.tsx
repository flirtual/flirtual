import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import type { ProspectKind } from "~/api/matchmaking";
import type { User } from "~/api/user";
import { useOptionalSession } from "~/hooks/use-session";
import { lazy } from "~/lazy";

import { frame } from "./frame";
import { hideKeyboardOnScroll } from "./keyboard";
import { anchorMessageLists } from "./scroll-anchor";
import { ChatSkeleton } from "./skeleton";
import { followStickyAvatars } from "./sticky-avatars";

const loadBody = () => import("./body").then(({ default: ChatBody }) => ChatBody);

const ChatBody = lazy(loadBody, { fallback: <ChatSkeleton /> });

export function preloadChat() {
	void loadBody();
}

function followChat(element: HTMLDivElement) {
	const stopAvatars = followStickyAvatars(element);
	const stopAnchors = anchorMessageLists(element);
	const stopKeyboard = hideKeyboardOnScroll(element);

	return () => {
		stopAvatars();
		stopAnchors();
		stopKeyboard();
	};
}

export const Chat: FC<{
	conversationId: string;
	participants: Array<User>;
	kind?: ProspectKind;
} & React.ComponentProps<"div">> = ({ conversationId, participants, kind, className, ...props }) => {
	const session = useOptionalSession();

	return (
		<div data-block data-chatbox className={twMerge(frame, className)} {...props} ref={followChat}>
			{session && (
				<ChatBody
					key={conversationId}
					conversationId={conversationId}
					kind={kind}
					me={session.user}
					participants={participants}
				/>
			)}
		</div>
	);
};
