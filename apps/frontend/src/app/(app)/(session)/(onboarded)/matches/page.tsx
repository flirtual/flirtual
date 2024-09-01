import { ConversationAside } from "./aside";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Matches"
};

export default async function ConversationListPage() {
	return <ConversationAside />;
}
