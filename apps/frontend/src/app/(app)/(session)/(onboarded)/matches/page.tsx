import type { Metadata } from "next";

import { ConversationAside } from "./aside";

export const metadata: Metadata = {
	title: "Matches"
};

export default async function ConversationListPage() {
	return <ConversationAside />;
}
