import { lazy, Suspense } from "react";
import { Outlet } from "react-router";

import { AnalyticsProvider } from "./analytics";
import { AgeGate } from "./components/age-gate";
import { InsetPreview } from "./components/inset-preview";
import { Loading } from "./components/loading";
import { development } from "./const";
import { ConfigSubscriber } from "./hooks/use-config";
import { DialogProvider } from "./hooks/use-dialog";
import { ToastProvider } from "./hooks/use-toast";
import { QueryProvider } from "./query";

const Monitoring = lazy(() => import("./monitoring").then(({ Monitoring }) => ({ default: Monitoring })));
const UpdateInformation = lazy(() => import("./components/update-information").then(({ UpdateInformation }) => ({ default: UpdateInformation })));

export function App() {
	return (
		<>
			<Monitoring />
			{development && <InsetPreview />}
			<QueryProvider>
				<AnalyticsProvider>
					<Suspense fallback={null}>
						<ConfigSubscriber />
					</Suspense>
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
				</AnalyticsProvider>
			</QueryProvider>
		</>
	);
}
