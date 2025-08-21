import { Suspense } from "react";
import { Outlet } from "react-router";

import Flitty from "~/components/flitty";
import { Loading } from "~/components/loading";
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
	useSession();

	return (
		<PurchaseProvider>
			<ShepherdProvider>
				<NotificationProvider>
					<RedirectBoundary>
						<Suspense fallback={<Loading />}>
							<Outlet />
						</Suspense>
					</RedirectBoundary>
					<ModerationMessageDialog />
					<DiscordSpamDialog />
					<Flitty />
				</NotificationProvider>
			</ShepherdProvider>
		</PurchaseProvider>
	);
}
