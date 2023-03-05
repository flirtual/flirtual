import { redirect } from "next/navigation";

import { api } from "~/api";
import { useConversation, useTalkjs } from "~/hooks/use-talkjs";
import { thruServerCookies } from "~/server-utilities";
import { urls } from "~/urls";

export interface ConversationPageProps {
	params: { userId: string };
}

export default async function ConversationPage({ params }: ConversationPageProps) {
	const targetUser = await api.user
		.get(params.userId, thruServerCookies())
		.catch(() => redirect(urls.conversations.list()));

	console.log(targetUser);

	return <div>aaa</div>;
}
