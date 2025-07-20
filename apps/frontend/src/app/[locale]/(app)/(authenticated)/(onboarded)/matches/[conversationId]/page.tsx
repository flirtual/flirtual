"use client";

import type { Metadata } from "next";
import { use, useEffect, useState } from "react";

import { Conversation } from "~/api/conversations";
import { displayName, User } from "~/api/user";
import { InlineLink } from "~/components/inline-link";
import { UserAvatar } from "~/components/user-avatar";
import { ConversationChatbox } from "~/hooks/use-talkjs";
import { redirect } from "~/i18n/navigation";
import { urls } from "~/urls";

import { ConversationAside } from "../aside";
import { LeaveButton } from "./leave-button";
import { VRChatButton } from "./vrchat-button";

export interface ConversationPageProps {
	params: Promise<{
		conversationId: string;
	}>;
}

export default function ConversationPage(props: ConversationPageProps) {
	const { conversationId } = use(props.params);
	const [conversation, setConversation] = useState<Awaited<ReturnType<typeof Conversation.get>> | undefined>();
	const [user, setUser] = useState<Awaited<ReturnType<typeof User.get>> | undefined>();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadData() {
			try {
				const conversationData = await Conversation.get(conversationId);
				if (!conversationData) {
					return notFound();
				}

				setConversation(conversationData);

				const userData = await User.get(conversationData.userId);
				if (!userData) {
					return notFound();
				}

				setUser(userData);
			}
			catch (reason) {
				console.error("Failed to load conversation data:", reason);
				return notFound();
			}
			finally {
				setLoading(false);
			}
		}

		loadData();
	}, [conversationId]);

	if (loading) {
		return (
			<div className="flex w-full shrink-0 flex-col desktop:flex-row desktop:justify-center desktop:gap-4">
				<ConversationAside activeConversationId={conversationId} />
				<div className="mt-0 h-fit w-full shrink-0 bg-brand-gradient vision:bg-none desktop:max-w-[38rem] desktop:shrink desktop:rounded-2xl desktop:p-1 desktop:shadow-brand-1">
					<div className="flex w-full items-center bg-brand-gradient p-3 vision:bg-none desktop:mt-0 desktop:rounded-t-xl android:desktop:mt-0">
						<div className="size-10 animate-pulse rounded-full bg-white-20"></div>
						<div className="ml-4 h-6 w-32 animate-pulse rounded bg-white-20"></div>
					</div>
				</div>
			</div>
		);
	}

	if (!conversation || !user) {
		return notFound();
	}

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
					<div className="ml-auto">
						{user.tags?.includes("official")
							? (
									<LeaveButton conversationId={conversation.id} />
								)
							: (
									<VRChatButton conversationId={conversation.id} user={user} />
								)}
					</div>
				</div>
				<ConversationChatbox conversationId={conversation.id} />
			</div>
		</div>
	);
}
