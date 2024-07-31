import { ModelCard } from "~/components/model-card";

import { ForgotPasswordForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Reset password"
};

export default function ForgotPage() {
	return (
		<ModelCard title="Reset password">
			<ForgotPasswordForm />
		</ModelCard>
	);
}
