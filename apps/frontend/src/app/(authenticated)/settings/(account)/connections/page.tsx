import { Metadata } from "next";

import { ConnectionsForm } from "./form";

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
