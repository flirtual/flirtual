import WidgetBot from "@widgetbot/react-embed";
import { Suspense } from "react";

import { useOptionalSession } from "~/hooks/use-session";
import { lazy } from "~/lazy";
import { urls } from "~/urls";

const DiscordEmbed_: React.FC = () => {
	const session = useOptionalSession();

	return (
		<WidgetBot
			avatar={session?.user ? urls.userAvatar(session?.user, "icon") : undefined}
			channel="862116319700582440"
			height="600"
			server="455219574036496404"
			username={session?.user.profile.displayName}
			width="100%"
		/>
	);
};

const LazyDiscordEmbed = lazy(() => DiscordEmbed_);

export const DiscordEmbed: React.FC = () => (
	<Suspense fallback={<div style={{ height: 600, width: "100%" }} />}>
		<LazyDiscordEmbed />
	</Suspense>
);
