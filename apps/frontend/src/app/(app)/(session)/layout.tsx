import { unstable_serialize } from "swr";

import { Authentication } from "~/api/auth";
import { Plan } from "~/api/plan";
import GlobalError from "~/app/global-error";
import {
	DiscordSpamDialog,
	ModerationMessageDialog
} from "~/components/modals/moderator-message";
import { ShepherdProvider } from "~/components/shepherd";
import { SWRConfig } from "~/components/swr";
import { maintenance } from "~/const";
import { NotificationProvider } from "~/hooks/use-notifications";
import { PurchaseProvider } from "~/hooks/use-purchase";

export default async function AuthenticatedLayout({
	children
}: React.PropsWithChildren) {
	// @ts-expect-error: maintenance doesn't need these properties
	if (maintenance) return <GlobalError />;

	const { user } = await Authentication.getSession();

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
