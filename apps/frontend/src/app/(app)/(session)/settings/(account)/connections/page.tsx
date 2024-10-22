import { ConnectionsForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Connections"
};

export default async function SettingsAccountConnectionsPage(props: {
	searchParams?: Promise<{
		error?: string;
	}>;
}) {
	const { error } = (await props.searchParams) || {};
	return <ConnectionsForm error={error} />;
}
