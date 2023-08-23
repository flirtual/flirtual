import { ModelCard } from "~/components/model-card";

import { DebugInfo } from "./debug-info";

export default async function DebuggerPage() {
	return (
		<div className="flex h-screen w-screen bg-cream font-nunito dark:bg-black-80 sm:items-center sm:justify-center">
			<ModelCard
				className="h-full sm:h-fit"
				containerProps={{ className: "gap-4" }}
				title="Debug"
			>
				<DebugInfo />
			</ModelCard>
		</div>
	);
}
