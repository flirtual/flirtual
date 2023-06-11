import { Onboarding3Form } from "./form";

import { ModelCard } from "~/components/model-card";

export default function Onboarding3Page() {
	return (
		<ModelCard className="shrink-0 sm:max-w-2xl" title="Bio & pics">
			<Onboarding3Form />
		</ModelCard>
	);
}
