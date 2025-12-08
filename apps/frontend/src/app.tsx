import { lazy, Suspense } from "react";
import { Outlet } from "react-router";

import { InsetPreview } from "./components/inset-preview";
import { Loading } from "./components/loading";
import { development } from "./const";
import { DialogProvider } from "./hooks/use-dialog";
import { ToastProvider } from "./hooks/use-toast";
import { QueryProvider } from "./query";

const Analytics = lazy(() => import("./analytics").then(({ Analytics }) => ({ default: Analytics })));
const UpdateInformation = lazy(() => import("./components/update-information").then(({ UpdateInformation }) => ({ default: UpdateInformation })));

export function App() {
	return (
		<>
			<Analytics />
			{development && <InsetPreview />}
			<QueryProvider>
				<UpdateInformation />
				<ToastProvider>
					<DialogProvider>
						<Suspense fallback={<Loading />}>
							<Outlet />
						</Suspense>
					</DialogProvider>
				</ToastProvider>
			</QueryProvider>
		</>
	);
}
