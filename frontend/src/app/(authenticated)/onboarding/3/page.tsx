import { ModelCard } from "~/components/model-card";

import { Onboarding3Form } from "./form";

export default function Onboarding3Page() {
	return (
		<ModelCard className="shrink-0 lg:w-1/2" title="Bio & pics">
			<Onboarding3Form />
		</ModelCard>
	);
}
