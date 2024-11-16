import type { Metadata } from "next";

import { Authentication } from "~/api/auth";

import { ActivationForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const session = await Authentication.getSession();
	const deactivated = !!session.user.deactivatedAt;

	return {
		title: deactivated ? "Reactivate account" : "Deactivate account"
	};
}

export default async function SettingsAccountDeactivatePage() {
	const session = await Authentication.getSession();

	return <ActivationForm user={session.user} />;
}
