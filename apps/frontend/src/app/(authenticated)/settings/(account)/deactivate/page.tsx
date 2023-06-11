import { Metadata } from "next";

import { ActivationForm } from "./form";

import { withSession } from "~/server-utilities";

export async function generateMetadata(): Promise<Metadata> {
	const session = await withSession();
	const deactivated = !!session.user.deactivatedAt;

	return {
		title: deactivated ? "Reactivate account" : "Deactivate account"
	};
}

export default async function SettingsAccountDeactivatePage() {
	const session = await withSession();

	return <ActivationForm user={session.user} />;
}
