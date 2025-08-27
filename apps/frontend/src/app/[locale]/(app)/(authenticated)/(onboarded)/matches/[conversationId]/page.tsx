import { ConversationAside } from "../aside";
import type { Route } from "./+types/page";
import { Conversation } from "./conversation";

export default function ConversationPage({ params: { conversationId } }: Route.ComponentProps) {
	return (
		<div className="flex w-full shrink-0 flex-col desktop:flex-row desktop:justify-center desktop:gap-4">
			<ConversationAside activeConversationId={conversationId} />
			<Conversation id={conversationId} />
		</div>
	);
}
