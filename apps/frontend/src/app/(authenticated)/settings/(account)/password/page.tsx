import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { PasswordChangeForm } from "./change-form";
import { PasswordPasskeyForm } from "./passkey-form";

export const metadata: Metadata = {
	title: "Password & passkeys"
};

export default function SettingsAccountPasswordPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Password & passkeys">
			<div className="flex flex-col gap-8">
				<PasswordChangeForm />
				<PasswordPasskeyForm />
			</div>
		</ModelCard>
	);
}
