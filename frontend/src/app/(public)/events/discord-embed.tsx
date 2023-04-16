"use client";

import WidgetBot from "@widgetbot/react-embed";
import { useEffect, useState } from "react";

export const DiscordEmbed: React.FC = () => {
	const [clientSide, setClientSide] = useState(false);
	useEffect(() => setClientSide(true), []);

	if (!clientSide) return null;

	return (
		<WidgetBot channel="862116319700582440" height="600" server="455219574036496404" width="100%" />
	);
};
