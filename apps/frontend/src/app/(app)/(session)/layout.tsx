import * as swrInfinite from "swr/infinite";

import {
	DiscordSpamDialog,
	ModerationMessageDialog
} from "~/components/modals/moderator-message";
import { TalkjsProvider } from "~/hooks/use-talkjs";
import { getSession } from "~/server-utilities";
import { getConversationsKey } from "~/hooks/use-conversations.shared";
import { SWRConfig } from "~/components/swr";

import type { ReactNode } from "react";

export default async function AuthenticatedLayout({
	children,
	debug
}: React.PropsWithChildren<{
	debug: ReactNode;
}>) {
	const { user } = await getSession();

	return (
		<SWRConfig
			value={{
				fallback: {
					[swrInfinite.unstable_serialize(getConversationsKey)]: []
				}
			}}
		>
			<TalkjsProvider>
				{children}
				{user.tags?.includes("debugger") && debug}
				{user.moderatorMessage && <ModerationMessageDialog />}
				{user.tnsDiscordInBiography &&
					new Date(user.tnsDiscordInBiography).getTime() < Date.now() && (
						<DiscordSpamDialog />
					)}
			</TalkjsProvider>
		</SWRConfig>
	);
}
