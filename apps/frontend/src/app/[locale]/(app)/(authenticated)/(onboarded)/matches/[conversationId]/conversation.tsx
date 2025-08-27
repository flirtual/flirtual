import { useTranslation } from "react-i18next";
import { withSuspense } from "with-suspense";

import { InlineLink } from "~/components/inline-link";
import { UserAvatar } from "~/components/user-avatar";
import { useConversation } from "~/hooks/use-conversations";
import { ConversationChatbox } from "~/hooks/use-talkjs";
import { useUser } from "~/hooks/use-user";
import { throwRedirect } from "~/redirect";
import { urls } from "~/urls";

import { LeaveButton } from "./leave-button";
import { VRChatButton } from "./vrchat-button";

export const Conversation = withSuspense<{ id: string }>(({ id: conversationId }) => {
	const { t } = useTranslation();

	const conversation = useConversation(conversationId);
	const user = useUser(conversation?.userId);

	if (!conversation || !user) throwRedirect(urls.conversations.list());

	return (
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
						{user.profile.displayName || t("unnamed_user")}
					</span>
				</InlineLink>
				<div className="ml-auto">
					{user.tags?.includes("official")
						? (
								<LeaveButton conversationId={conversationId} />
							)
						: (
								<VRChatButton conversationId={conversationId} user={user} />
							)}
				</div>
			</div>
			<ConversationChatbox conversationId={conversationId} />
		</div>
	);
}, {
	fallback: (
		<div className="mt-0 size-full shrink-0 bg-brand-gradient vision:bg-none desktop:max-w-[38rem] desktop:shrink desktop:rounded-2xl desktop:p-1 desktop:shadow-brand-1">
			<div className="flex w-full items-center bg-brand-gradient p-3 vision:bg-none desktop:mt-0 desktop:rounded-t-xl android:desktop:mt-0">
				<div className="size-10 animate-pulse rounded-full bg-white-20"></div>
				<div className="ml-4 h-6 w-32 animate-pulse rounded bg-white-20"></div>
			</div>
			<div className="h-full rounded-xl bg-white-20 shadow-brand-inset" />
		</div>
	)
});
