import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";

import { DebugInfo } from "./debug-info";

export default async function DebuggerPage() {
	return (
		<SoleModelLayout>
			<ModelCard
				className="h-full desktop:h-fit"
				containerProps={{ className: "gap-4" }}
				title="Debug information"
			>
				<DebugInfo />
			</ModelCard>
		</SoleModelLayout>
	);
}
