import { ModelCard } from "~/components/model-card";
import { SsrUserProvider } from "~/components/ssr-user-provider";

import { Onboarding1Form } from "./form";

async function Onboarding1Page() {
	return (
		/* @ts-expect-error: Server Component */
		<SsrUserProvider>
			<ModelCard title="Matchmaking">
				<Onboarding1Form />
			</ModelCard>
		</SsrUserProvider>
	);
}

export default Onboarding1Page;
