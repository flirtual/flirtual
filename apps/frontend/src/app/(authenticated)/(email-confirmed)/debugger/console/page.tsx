import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";

import { ConsoleForm } from "./form";

export default function DebuggerConsolePage() {
	return (
		<SoleModelLayout footer={{ desktopOnly: true }}>
			<ModelCard
				className="sm:max-w-5xl"
				containerProps={{ className: "sm:grid grid-cols-12 gap-8" }}
				title="Debugger"
			>
				<ConsoleForm />
			</ModelCard>
		</SoleModelLayout>
	);
}
