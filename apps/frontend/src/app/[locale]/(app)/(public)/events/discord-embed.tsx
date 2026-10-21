import WidgetBotModule from "@widgetbot/react-embed";
import { Suspense } from "react";

import * as brand from "~/brand";
import { useOptionalSession } from "~/hooks/use-session";
import { lazy } from "~/lazy";
import { urls } from "~/urls";

const WidgetBot = (WidgetBotModule as unknown as { default: typeof WidgetBotModule }).default;

const DiscordEmbed_: React.FC<{ server: string; channel: string }> = ({ server, channel }) => {
	const session = useOptionalSession();

	return (
		<WidgetBot
			avatar={session?.user ? urls.userAvatar(session?.user, "icon") : undefined}
			channel={channel}
			height="600"
			server={server}
			username={session?.user.profile.displayName}
			width="100%"
		/>
	);
};

const LazyDiscordEmbed = lazy(() => DiscordEmbed_);

export const DiscordEmbed: React.FC = () => brand.discordEmbed && (
	<Suspense fallback={<div style={{ height: 600, width: "100%" }} />}>
		<LazyDiscordEmbed {...brand.discordEmbed} />
	</Suspense>
);
