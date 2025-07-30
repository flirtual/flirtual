import { Outlet } from "react-router";

import Flitty from "~/components/flitty";
import {
	DiscordSpamDialog,
	ModerationMessageDialog
} from "~/components/modals/moderator-message";
import { ShepherdProvider } from "~/components/shepherd";
import { NotificationProvider } from "~/hooks/use-notifications";
import { PurchaseProvider } from "~/hooks/use-purchase";
import { useSession } from "~/hooks/use-session";

export default function AuthenticatedLayout() {
	useSession();

	return (
		<PurchaseProvider>
			<ShepherdProvider>
				<NotificationProvider>
					<Outlet />
					<ModerationMessageDialog />
					<DiscordSpamDialog />
					<Flitty />
				</NotificationProvider>
			</ShepherdProvider>
		</PurchaseProvider>
	);
}
