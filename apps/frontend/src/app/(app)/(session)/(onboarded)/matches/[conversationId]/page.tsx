import { cache } from "react";
import { redirect } from "next/navigation";

import { getProfileUser } from "../../(sole-model)/[slug]/profile-user";
import { ConversationAside } from "../aside";

import { FaceTimeButton } from "./facetime-button";

import type { Metadata } from "next";

import { ConversationChatbox } from "~/hooks/use-talkjs";
import { displayName } from "~/api/user";
import { api } from "~/api";
import { urls } from "~/urls";
import { thruServerCookies, getSession } from "~/server-utilities";
import { UserAvatar } from "~/components/user-avatar";
import { InlineLink } from "~/components/inline-link";
import { Button } from "~/components/button";

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
	const session = await getSession();
	const conversation = await getConversation(params.conversationId);
	const user = await getProfileUser(conversation.userId);

	if (
		!user ||
		(!user.relationship?.matched && !session.user.tags?.includes("admin"))
	)
		return redirect(urls.conversations.list());

	return (
		<>
			<ConversationAside activeConversationId={conversation.id} />
			<div className="size-full bg-brand-gradient vision:bg-none desktop:max-w-[38rem] desktop:rounded-2xl desktop:p-1 desktop:shadow-brand-1">
				<div className="mt-[max(calc(env(safe-area-inset-top,0rem)+1.75rem),2.25rem)] flex w-full items-center bg-brand-gradient p-3 pt-[0.5625rem] vision:bg-none android:mt-[max(calc(var(--safe-area-inset-top,0rem)+1.5rem),2rem)] desktop:mt-0 desktop:rounded-t-xl android:desktop:mt-0">
					<InlineLink
						className="flex items-center gap-4 hocus:no-underline"
						href={urls.profile(user)}
					>
						<UserAvatar
							className="mb-[0.0625rem] rounded-full"
							height={40}
							user={user}
							variant="icon"
							width={40}
						/>
						<span className="select-none font-montserrat text-2xl font-semibold text-white-20 desktop:font-extrabold">
							{displayName(user)}
						</span>
					</InlineLink>
					<FaceTimeButton user={user} />
				</div>
				<ConversationChatbox conversationId={conversation.id} />
			</div>
		</>
	);
}
