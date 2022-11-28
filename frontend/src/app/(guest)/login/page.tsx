import { ModelCard } from "~/components/model-card";

import { LoginForm } from "./form";

export default function LoginPage() {
	return (
		<ModelCard className="sm:w-full sm:max-w-lg" title="Login">
			<LoginForm />
		</ModelCard>
	);
}
