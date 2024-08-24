"use client";

import WidgetBot from "@widgetbot/react-embed";
import dynamic from "next/dynamic";

import { displayName } from "~/api/user";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

export const _DiscordEmbed: React.FC = () => {
	const [session] = useSession();

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

export const DiscordEmbed = dynamic(() => Promise.resolve(_DiscordEmbed), {
	ssr: false,
	loading: () => <div style={{ height: 600, width: "100%" }} />
});
