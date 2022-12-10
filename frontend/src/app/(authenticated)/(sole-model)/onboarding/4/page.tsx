import { ModelCard } from "~/components/model-card";

import { Onboarding4Form } from "./form";

export const config = { runtime: "experimental-edge" };

export default function Onboarding4Page() {
	return (
		<ModelCard title="Personality">
			<Onboarding4Form />
		</ModelCard>
	);
}
