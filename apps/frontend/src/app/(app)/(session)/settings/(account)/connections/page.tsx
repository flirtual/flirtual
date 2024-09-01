import { ConnectionsForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Connections"
};

export default function SettingsAccountConnectionsPage(props: {
	searchParams?: {
		error?: string;
	};
}) {
	const error = props.searchParams?.error;
	return <ConnectionsForm error={error} />;
}
