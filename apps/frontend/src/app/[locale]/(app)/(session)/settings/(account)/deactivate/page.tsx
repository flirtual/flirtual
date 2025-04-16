import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Authentication } from "~/api/auth";

import { ActivationForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	const session = await Authentication.getOptionalSession();
	const deactivated = !!session.user.deactivatedAt;

	return {
		title: deactivated ? t("reactivate_account") : t("deactivate_account")
	};
}

export const dynamic = "force-dynamic";

export default async function SettingsAccountDeactivatePage() {
	const session = await Authentication.getOptionalSession();

	return <ActivationForm user={session.user} />;
}
