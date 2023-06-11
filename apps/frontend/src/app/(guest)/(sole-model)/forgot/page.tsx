import { Metadata } from "next";

import { ForgotPasswordForm } from "./form";

import { ModelCard } from "~/components/model-card";

export const metadata: Metadata = {
	title: "Reset password"
};

export default function ForgotPage() {
	return (
		<ModelCard title="Reset Password">
			<ForgotPasswordForm />
		</ModelCard>
	);
}
