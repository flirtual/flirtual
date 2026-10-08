import { SplitLayout } from "../split-layout";
import type { Route } from "./+types/page";
import { Conversation } from "./conversation";

export default function ConversationPage({ params: { conversationId } }: Route.ComponentProps) {
	return (
		<SplitLayout activeConversationId={conversationId}>
			<Conversation id={conversationId} />
		</SplitLayout>
	);
}
