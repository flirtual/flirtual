import { lazy, Suspense } from "react";
import { Outlet } from "react-router";

import { AnalyticsProvider } from "./analytics";
import { AgeGate } from "./components/age-gate";
import { InsetPreview } from "./components/inset-preview";
import { Loading } from "./components/loading";
import { development, server } from "./const";
import { ConfigSubscriber } from "./hooks/use-config";
import { DialogProvider } from "./hooks/use-dialog";
import { InterruptionProvider } from "./hooks/use-interruption";
import { ToastProvider } from "./hooks/use-toast";
import { QueryProvider } from "./query";

const UpdateInformation = lazy(() => import("./components/update-information").then(({ UpdateInformation }) => ({ default: UpdateInformation })));

export function App() {
	return (
		<>
			{development && <InsetPreview />}
			<QueryProvider>
				<AnalyticsProvider>
					{!server && (
						<Suspense fallback={null}>
							<ConfigSubscriber />
						</Suspense>
					)}
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
