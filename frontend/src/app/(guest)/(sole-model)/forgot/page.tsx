import { ModelCard } from "~/components/model-card";

import { ForgotPasswordForm } from "./form";

export default function ForgotPage() {
	return (
		<ModelCard title="Reset Password">
			<ForgotPasswordForm />
		</ModelCard>
	);
}
