import { getSession } from "~/api/auth";

import { ActivationForm } from "./form";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
	const session = await getSession();
	const deactivated = !!session.user.deactivatedAt;

	return {
		title: deactivated ? "Reactivate account" : "Deactivate account"
	};
}

export default async function SettingsAccountDeactivatePage() {
	const session = await getSession();

	return <ActivationForm user={session.user} />;
}
