import WidgetBot from "@widgetbot/react-embed";
import { lazy, Suspense } from "react";

import { displayName } from "~/api/user";
import { useOptionalSession } from "~/hooks/use-session";
import { urls } from "~/urls";

const DiscordEmbed_: React.FC = () => {
	const session = useOptionalSession();

	return (
		<WidgetBot
			avatar={session?.user ? urls.userAvatar(session?.user) : undefined}
			channel="862116319700582440"
			height="600"
			server="455219574036496404"
			username={session?.user ? displayName(session?.user) : undefined}
			width="100%"
		/>
	);
};

const LazyDiscordEmbed = lazy(() => Promise.resolve({ default: DiscordEmbed_ }));

export const DiscordEmbed: React.FC = () => (
	<Suspense fallback={<div style={{ height: 600, width: "100%" }} />}>
		<LazyDiscordEmbed />
	</Suspense>
);
