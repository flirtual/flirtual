import { useTranslation } from "react-i18next";
import { withSuspense } from "with-suspense";

import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ProfileDropdown } from "~/components/profile/dropdown";
import { UserAvatar } from "~/components/user-avatar";
import { useConversation } from "~/hooks/use-conversations";
import { useSession } from "~/hooks/use-session";
import { ConversationChatbox } from "~/hooks/use-talkjs";
import { useUser } from "~/hooks/use-user";
import { urls } from "~/urls";

import { LeaveButton } from "./leave-button";
import { VRChatButton } from "./vrchat-button";

export const Conversation = withSuspense<{ id: string }>(({ id: conversationId }) => {
	const { user: me } = useSession();
	const { t } = useTranslation();

	const conversation = useConversation(conversationId);
	const user = useUser(conversation?.userId);

	if (!conversation || !user) {
		return (
			<div className="mt-0 h-fit w-full shrink-0 bg-brand-gradient vision:bg-none desktop:max-w-[38rem] desktop:shrink desktop:rounded-2xl desktop:p-1 desktop:shadow-brand-1">
				<div className="flex h-16 w-full items-center justify-center bg-brand-gradient px-3 vision:bg-none desktop:mt-0 desktop:rounded-t-xl android:desktop:mt-0">
					<span className="text-center font-montserrat text-2xl font-semibold text-white-20 desktop:font-extrabold">
						{t("chat_unavailable")}
					</span>
				</div>
				<div className="flex flex-col gap-8 bg-white-20 p-8 vision:bg-transparent dark:bg-black-70 desktop:rounded-xl desktop:shadow-brand-inset">
					<span className="font-nunito text-black-70 dark:text-white-20">
						{t("chat_unavailable_description")}
					</span>
					<ButtonLink className="desktop:hidden" href={urls.conversations.list()} size="sm">
						{t("back_to_matches")}
					</ButtonLink>
				</div>
			</div>
		);
	}

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
				<div className="ml-auto flex items-center gap-4 text-white-20">
					{(me.tags?.includes("moderator") || me.tags?.includes("admin")) && <ProfileDropdown userId={user.id} />}
					{user.tags?.includes("official")
						? (
								<LeaveButton conversationId={conversationId} />
							)
						: me.tags?.includes("debugger") && (
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
