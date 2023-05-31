import { ModelCard } from "~/components/model-card";
import { thruServerCookies, withSession } from "~/server-utilities";
import { api } from "~/api";

import { Onboarding4Form } from "./form";

export default async function Onboarding4Page() {
	const session = await withSession();
	const personality = await api.user.profile.getPersonality(session.user.id, thruServerCookies());

	return (
		<ModelCard className="sm:max-w-2xl" title="Personality">
			<Onboarding4Form personality={personality} />
		</ModelCard>
	);
}
