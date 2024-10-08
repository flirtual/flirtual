import { unstable_serialize } from "swr";

import {
	DiscordSpamDialog,
	ModerationMessageDialog
} from "~/components/modals/moderator-message";
import { TalkjsProvider } from "~/hooks/use-talkjs";
import { SWRConfig } from "~/components/swr";
import { PurchaseProvider } from "~/hooks/use-purchase";
import { ShepherdProvider } from "~/components/shepherd";
import { NotificationProvider } from "~/hooks/use-notifications";
import { Plan } from "~/api/plan";
import { Authentication } from "~/api/auth";

export default async function AuthenticatedLayout({
	children
}: React.PropsWithChildren) {
	const [{ user }, plans] = await Promise.all([
		Authentication.getSession(),
		Plan.list()
	]);

	return (
		<SWRConfig
			value={{
				fallback: {
					[unstable_serialize("plans")]: plans
				}
			}}
		>
			<PurchaseProvider>
				<TalkjsProvider>
					<ShepherdProvider>
						<NotificationProvider>
							{children}
							{user.moderatorMessage && <ModerationMessageDialog />}
							{user.tnsDiscordInBiography &&
								new Date(user.tnsDiscordInBiography).getTime() < Date.now() && (
									<DiscordSpamDialog />
								)}
						</NotificationProvider>
					</ShepherdProvider>
				</TalkjsProvider>
			</PurchaseProvider>
		</SWRConfig>
	);
}
