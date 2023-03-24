import { ModelCard } from "~/components/model-card";

import { RegisterForm } from "./form";

export default function RegisterPage() {
	return (
		<ModelCard title="Create account">
			<RegisterForm />
		</ModelCard>
	);
}
