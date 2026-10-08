import { lazy, Suspense } from "react";
import { Outlet } from "react-router";

import { AnalyticsProvider } from "./analytics";
import { AgeGate } from "./components/age-gate";
import { DebugTools } from "./components/debug-tools";
import { Loading } from "./components/loading";
import { server } from "./const";
import { ConfigSubscriber } from "./hooks/use-config";
import { DialogProvider } from "./hooks/use-dialog";
import { InterruptionProvider } from "./hooks/use-interruption";
import { ToastProvider } from "./hooks/use-toast";
import { QueryProvider } from "./query";

const UpdateInformation = lazy(() => import("./components/update-information").then(({ UpdateInformation }) => ({ default: UpdateInformation })));

export function App() {
	return (
		<>
			<QueryProvider>
				<DebugTools />
				<AnalyticsProvider>
					<Suspense fallback={null}>
						{!server && <ConfigSubscriber />}
					</Suspense>
					<InterruptionProvider>
						<UpdateInformation />
						<ToastProvider>
							<DialogProvider>
								<Suspense fallback={<Loading />}>
									<AgeGate>
										<Outlet />
									</AgeGate>
								</Suspense>
							</DialogProvider>
						</ToastProvider>
					</InterruptionProvider>
				</AnalyticsProvider>
			</QueryProvider>
		</>
	);
}
