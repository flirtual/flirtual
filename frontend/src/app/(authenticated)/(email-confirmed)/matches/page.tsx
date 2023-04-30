import { ConversationAside } from "./aside";
import { withConversations } from "./data.server";

export default async function ConversationListPage() {
	const initialConversations = await withConversations();

	return <ConversationAside initialConversations={initialConversations} />;
}
