import { Suspense } from "react";
import type { FC, PropsWithChildren } from "react";

import { SplitPanes } from "~/components/split-panes";
import { useBreakpoint } from "~/hooks/use-breakpoint";
import { useHasConversations } from "~/hooks/use-conversations";

import { ConversationAside } from "./aside";

// The match list beside the page in split layouts, once there are matches to list. Elsewhere it only
// shows with a conversation.
export const SplitLayout: FC<PropsWithChildren<{ activeConversationId?: string }>> = ({ activeConversationId, children }) => {
	const split = useBreakpoint("split");
	const hasConversations = useHasConversations();
	if (!(split && hasConversations) && !activeConversationId) return children;

	return (
		<SplitPanes
			aside={(
				<Suspense>
					<ConversationAside activeConversationId={activeConversationId} />
				</Suspense>
			)}
			asideClassName="desktop:w-96"
			className="web-nav:desktop:grow-0"
			mainClassName="desktop:max-w-[38rem]"
		>
			{children}
		</SplitPanes>
	);
};
