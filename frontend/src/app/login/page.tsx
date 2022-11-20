import { redirect } from "next/navigation";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { useServerAuthenticate } from "~/server-utilities";

import { LoginForm } from "./form";

export default async function LoginPage() {
	const user = await useServerAuthenticate({ optional: true });
	if (user) redirect(`/${user.id}`);

	return (
		<SoleModelLayout>
			<ModelCard className="sm:w-full sm:max-w-lg" title="Login">
				<LoginForm />
			</ModelCard>
		</SoleModelLayout>
	);
}
