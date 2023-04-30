import { ConversationChatbox } from "~/hooks/use-talkjs";

import { ConversationAside } from "../aside";
import { withConversations } from "../data.server";

export interface ConversationPageProps {
	params: {
		userId: string;
	};
}

export default async function ConversationPage(props: ConversationPageProps) {
	const {
		params: { userId }
	} = props;

	const initialConversations = await withConversations();

	return (
		<>
			<ConversationAside activeConversation={userId} initialConversations={initialConversations} />
			<div className="flex h-full w-full flex-col items-center justify-center md:pl-8">
				<ConversationChatbox
					className="h-[calc(100vh-8rem)] w-full overflow-hidden shadow-brand-1 md:h-[32rem] md:rounded-xl"
					userId={userId}
				/>
			</div>
		</>
	);
}
