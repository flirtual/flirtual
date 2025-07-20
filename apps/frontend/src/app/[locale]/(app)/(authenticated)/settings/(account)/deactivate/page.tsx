

import { DeactivationForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("deactivate_account")
	};
}

export default function SettingsAccountDeactivatePage() {


	return <DeactivationForm />;
}
