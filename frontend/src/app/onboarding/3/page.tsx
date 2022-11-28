import { ModelCard } from "~/components/model-card";
import { SsrUserProvider } from "~/components/ssr-user-provider";

import { Onboarding3Form } from "./form";

export default function Onboarding3Page() {
	return (
		// @ts-expect-error: Server Component
		<SsrUserProvider>
			<ModelCard className="shrink-0 lg:w-1/2" title="Bio & pics">
				<Onboarding3Form />
			</ModelCard>
		</SsrUserProvider>
	);
}
