import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Authentication } from "~/api/auth";

import { ActivationForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	const session = await Authentication.getSession();
	const deactivated = !!session.user.deactivatedAt;

	return {
		title: deactivated ? t("reactivate_account") : t("deactivate_account")
	};
}

export default async function SettingsAccountDeactivatePage() {
	const session = await Authentication.getSession();

	return <ActivationForm user={session.user} />;
}
