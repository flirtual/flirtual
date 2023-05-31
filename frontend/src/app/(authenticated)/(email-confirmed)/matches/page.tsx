import { Metadata } from "next";

import { ConversationAside } from "./aside";

export const metadata: Metadata = {
	title: "Conversations"
};

export default async function ConversationListPage() {
	return <ConversationAside />;
}
