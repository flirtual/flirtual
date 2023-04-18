"use client";

import WidgetBot from "@widgetbot/react-embed";
import { useEffect, useState } from "react";

import { displayName } from "~/api/user";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

export const DiscordEmbed: React.FC = () => {
	const [clientSide, setClientSide] = useState(false);
	useEffect(() => setClientSide(true), []);

	const [session] = useSession();

	if (!clientSide) return null;

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
