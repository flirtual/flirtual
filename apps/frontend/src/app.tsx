import { LazyMotion } from "motion/react";
import { Outlet } from "react-router";

import { AnalyticsProvider } from "./analytics";
import { InsetPreview } from "./components/inset-preview";
import { TooltipProvider } from "./components/tooltip";
import { UpdateInformation } from "./components/update-information";
import { development } from "./const";
import { ToastProvider } from "./hooks/use-toast";
import { QueryProvider } from "./query";

export function App() {
	return (
		<>
			<AnalyticsProvider />
			{development && <InsetPreview />}
			<LazyMotion strict features={async () => ((await import("./motion")).default)}>
				<QueryProvider>
					<UpdateInformation />
					<ToastProvider>
						<TooltipProvider>
							<Outlet />
						</TooltipProvider>
					</ToastProvider>
				</QueryProvider>
			</LazyMotion>
		</>
	);
}
