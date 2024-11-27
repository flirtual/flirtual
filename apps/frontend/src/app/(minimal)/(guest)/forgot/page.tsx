import type { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { ForgotPasswordForm } from "./form";

export const metadata: Metadata = {
	title: "Reset password"
};

export default function ForgotPage() {
	return (
		<ModelCard branded title="Reset password">
			<ForgotPasswordForm />
		</ModelCard>
	);
}
