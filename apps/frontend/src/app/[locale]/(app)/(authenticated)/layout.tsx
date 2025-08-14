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
import { RedirectBoundary } from "~/redirect";

export default function AuthenticatedLayout() {
	console.log("auth loayout");
	useSession();

	return (
		<PurchaseProvider>
			<ShepherdProvider>
				<NotificationProvider>
					<RedirectBoundary>
						<Outlet />
					</RedirectBoundary>
					<ModerationMessageDialog />
					<DiscordSpamDialog />
					<Flitty />
				</NotificationProvider>
			</ShepherdProvider>
		</PurchaseProvider>
	);
}
