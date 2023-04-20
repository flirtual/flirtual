import { ConversationChatbox } from "~/hooks/use-talkjs";

import { ConversationAside } from "../aside";

export interface ConversationPageProps {
	params: { userId: string };
}

export default async function ConversationPage({ params: { userId } }: ConversationPageProps) {
	return (
		<>
			{/* @ts-expect-error: Server Component */}
			<ConversationAside activeConversation={userId} />
			<div className="flex h-full w-full flex-col items-center justify-center md:pl-8">
				<ConversationChatbox
					className="h-[calc(100vh-8rem)] w-full overflow-hidden shadow-brand-1 md:h-[32rem] md:rounded-xl"
					userId={userId}
				/>
			</div>
		</>
	);
}
