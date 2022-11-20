import { ModelCard } from "~/components/model-card";
import { SsrUserProvider } from "~/components/ssr-user-provider";

import { Onboarding2Form } from "./form";

const Onboarding2Page: React.FC = () => {
	return (
		// @ts-expect-error: Server Component
		<SsrUserProvider>
			<ModelCard className="shrink-0 lg:w-1/2" title="Info & tags">
				<Onboarding2Form />
			</ModelCard>
		</SsrUserProvider>
	);
};

export default Onboarding2Page;
