import { unstable_serialize } from "swr";

import { Authentication } from "~/api/auth";
import { Plan } from "~/api/plan";
import {
	DiscordSpamDialog,
	ModerationMessageDialog
} from "~/components/modals/moderator-message";
import { ShepherdProvider } from "~/components/shepherd";
import { SWRConfig } from "~/components/swr";
import { NotificationProvider } from "~/hooks/use-notifications";
import { PurchaseProvider } from "~/hooks/use-purchase";

export default async function AuthenticatedLayout({
	children
}: React.PropsWithChildren) {
	const [{ user }] = await Promise.all([
		Authentication.getSession(),
	]);

	return (
		<SWRConfig
			value={{
				fallback: {
					[unstable_serialize("plans")]: Plan.list()
				}
			}}
		>
			<PurchaseProvider>
				<ShepherdProvider>
					<NotificationProvider>
						{children}
						{user.moderatorMessage && <ModerationMessageDialog />}
						{user.tnsDiscordInBiography
						&& new Date(user.tnsDiscordInBiography).getTime() < Date.now() && (
							<DiscordSpamDialog />
						)}
					</NotificationProvider>
				</ShepherdProvider>
			</PurchaseProvider>
		</SWRConfig>
	);
}
