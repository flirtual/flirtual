import { ModelCard } from "~/components/model-card";

import { Onboarding2Form } from "./form";

export const config = { runtime: "experimental-edge" };

export default function Onboarding2Page() {
	return (
		<ModelCard className="shrink-0 lg:w-1/2" title="Info & tags">
			<Onboarding2Form />
		</ModelCard>
	);
}
