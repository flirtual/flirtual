import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Authentication } from "~/api/auth";
import { Conversation } from "~/api/conversations";
import { displayName } from "~/api/user";
import { InlineLink } from "~/components/inline-link";
import { UserAvatar } from "~/components/user-avatar";
import { ConversationChatbox } from "~/hooks/use-talkjs";
import { urls } from "~/urls";

import { getProfile } from "../../[slug]/data";
import { ConversationAside } from "../aside";
import { FaceTimeButton } from "./facetime-button";

export interface ConversationPageProps {
	params: Promise<{
		conversationId: string;
	}>;
}

export async function generateMetadata(
	props: ConversationPageProps
): Promise<Metadata> {
	const { conversationId } = (await props.params) || {};
	const conversation = await Conversation.get(conversationId);
	if (!conversation) return redirect(urls.conversations.list());

	const user = await getProfile(conversation.userId);
	if (!user) return redirect(urls.conversations.list());

	return {
		title: displayName(user)
	};
}

export default async function ConversationPage(props: ConversationPageProps) {
	const { conversationId } = (await props.params) || {};
	const session = await Authentication.getSession();

	const conversation = await Conversation.get(conversationId);
	if (!conversation) return redirect(urls.conversations.list());

	const user = await getProfile(conversation.userId);

	if (
		!user
		|| (!user.relationship?.matched && !session.user.tags?.includes("admin"))
	)
		return redirect(urls.conversations.list());

	return (
		<div className="flex w-full shrink-0 flex-col desktop:flex-row desktop:justify-center desktop:gap-4">
			<ConversationAside activeConversationId={conversation.id} />
			<div className="mt-0 h-fit w-full shrink-0 bg-brand-gradient vision:bg-none desktop:max-w-[38rem] desktop:shrink desktop:rounded-2xl desktop:p-1 desktop:shadow-brand-1">
				<div className="flex w-full items-center bg-brand-gradient p-3 vision:bg-none desktop:mt-0 desktop:rounded-t-xl android:desktop:mt-0">
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
						<span data-mask className="font-montserrat text-2xl font-semibold text-white-20 desktop:font-extrabold">
							{displayName(user)}
						</span>
					</InlineLink>
					<FaceTimeButton user={user} />
				</div>
				<ConversationChatbox conversationId={conversation.id} />
			</div>
		</div>
	);
}
