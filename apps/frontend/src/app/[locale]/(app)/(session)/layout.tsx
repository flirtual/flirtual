"use client";

import GlobalError from "~/app/global-error";
import Flitty from "~/components/flitty";
import {
	DiscordSpamDialog,
	ModerationMessageDialog
} from "~/components/modals/moderator-message";
import { ShepherdProvider } from "~/components/shepherd";
import { maintenance } from "~/const";
import { NotificationProvider } from "~/hooks/use-notifications";
import { PurchaseProvider } from "~/hooks/use-purchase";

export default function AuthenticatedLayout({
	children
}: React.PropsWithChildren) {
	// @ts-expect-error: maintenance doesn't need these properties
	if (maintenance) return <GlobalError />;

	// const { user } = await Authentication.getSession();

	return (
		<PurchaseProvider>
			<ShepherdProvider>
				<NotificationProvider>
					{children}
					<ModerationMessageDialog />
					<DiscordSpamDialog />
					<Flitty />
				</NotificationProvider>
			</ShepherdProvider>
		</PurchaseProvider>
	);
}
