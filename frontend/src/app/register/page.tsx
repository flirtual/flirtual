import { redirect } from "next/navigation";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { useServerAuthenticate } from "~/server-utilities";

import { RegisterForm } from "./form";

export default async function RegisterPage() {
	const user = await useServerAuthenticate({ optional: true });
	if (user) redirect(`/${user.username}`);

	return (
		<SoleModelLayout>
			<ModelCard className="sm:w-full sm:max-w-lg" title="Register">
				<RegisterForm />
			</ModelCard>
		</SoleModelLayout>
	);
}
