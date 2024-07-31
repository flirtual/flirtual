import * as swrInfinite from "swr/infinite";

import { ModeratorMessageDialog } from "~/components/modals/moderator-message";
import { TalkjsProvider } from "~/hooks/use-talkjs";
import { withSession } from "~/server-utilities";
import { getConversationsKey } from "~/hooks/use-conversations.shared";
import { SWRConfig } from "~/components/swr";

export default async function AuthenticatedLayout({
	children
}: React.PropsWithChildren) {
	const session = await withSession();

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
				{session?.user.moderatorMessage && <ModeratorMessageDialog />}
			</TalkjsProvider>
		</SWRConfig>
	);
}
