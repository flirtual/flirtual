import { ConversationAside } from "./aside";

export default function ConversationListPage() {
	// @ts-expect-error: Server Component
	return <ConversationAside />;
}
