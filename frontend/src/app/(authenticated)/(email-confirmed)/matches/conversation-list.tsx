"use client";

import { useSelectedLayoutSegment } from "next/navigation";

import { useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";
import { ConversationInbox } from "~/hooks/use-talkjs";

export const ConversationList: React.FC = () => {
	const layoutSegment = useSelectedLayoutSegment();
	const isDesktop = useScreenBreakpoint("md");

	if (!(isDesktop || !layoutSegment)) return null;

	return (
		<ConversationInbox
			className="h-[calc(100vh_-_8rem)] w-full md:h-screen"
			options={{
				showFeedHeader: false,
				showMobileBackButton: false,
				theme: "next-mobile",
				feedFilter: {
					custom: {
						banned: "!exists"
					}
				}
			}}
		/>
	);
};
