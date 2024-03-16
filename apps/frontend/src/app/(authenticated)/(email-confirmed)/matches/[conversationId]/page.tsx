import { Metadata } from "next";
import { cache } from "react";
import { redirect } from "next/navigation";

import { ConversationChatbox } from "~/hooks/use-talkjs";
import { displayName } from "~/api/user";
import { api } from "~/api";
import { urls } from "~/urls";
import { thruServerCookies } from "~/server-utilities";
import { UserAvatar } from "~/components/user-avatar";
import { InlineLink } from "~/components/inline-link";

import { getProfileUser } from "../../(sole-model)/[username]/profile-user";
import { ConversationAside } from "../aside";

import { FaceTimeButton } from "./facetime-button";

export interface ConversationPageProps {
	params: {
		conversationId: string;
	};
}

const getConversation = cache(async (conversationId: string) => {
	return api.conversations
		.get(conversationId, thruServerCookies())
		.catch(() => redirect(urls.conversations.list()));
});

export async function generateMetadata({
	params
}: ConversationPageProps): Promise<Metadata> {
	const conversation = await getConversation(params.conversationId);
	const user = await getProfileUser(conversation.userId);

	return {
		title: displayName(user)
	};
}

export default async function ConversationPage({
	params
}: ConversationPageProps) {
	const conversation = await getConversation(params.conversationId);
	const user = await getProfileUser(conversation.userId);

	if (!user || !user.relationship?.matched)
		return redirect(urls.conversations.list());

	return (
		<>
			<ConversationAside activeConversationId={conversation.id} />
			<div className="flex h-full w-full flex-col items-center justify-center md:pl-8">
				<div className="h-full w-full md:rounded-xl md:shadow-brand-1">
					<div className="mt-[max(calc(3.25rem+env(safe-area-inset-top)),3.75rem)] flex w-full bg-brand-gradient p-3 md:mt-0 md:rounded-t-xl">
						<InlineLink
							className="flex items-center gap-4 hocus:no-underline"
							href={urls.profile(user)}
						>
							<UserAvatar
								className="rounded-full"
								height={40}
								user={user}
								width={40}
							/>
							<span className="select-none font-montserrat text-xl font-semibold text-white-10">
								{displayName(user)}
							</span>
					<FaceTimeButton user={user} />
					</div>
					<ConversationChatbox conversationId={conversation.id} />
				</div>
			</div>
		</>
	);
}
