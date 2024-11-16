import type { Metadata } from "next";

import { ConnectionsForm } from "./form";

export const metadata: Metadata = {
	title: "Connections"
};

export default async function SettingsAccountConnectionsPage({ searchParams }: {
	searchParams?: Promise<{
		error?: string;
	}>;
}) {
	const { error } = (await searchParams) || {};
	return <ConnectionsForm error={error} />;
}
