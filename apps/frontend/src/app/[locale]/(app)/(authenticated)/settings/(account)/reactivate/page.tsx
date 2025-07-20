

import { ReactivationForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("reactivate_account")
	};
}

export default function SettingsAccountReactivatePage() {


	return <ReactivationForm />;
}
