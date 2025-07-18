import { Suspense } from "react";
import { Outlet } from "react-router";

import { LoadingIndicator } from "../(app)/loading-indicator";

export default function MinimalLayout() {
	return (
		<div className="flex min-h-screen w-full grow flex-col items-center desktop:flex-col desktop:p-8">
			<Suspense fallback={<LoadingIndicator className="absolute inset-0" />}>
				<Outlet />
			</Suspense>
		</div>
	);
}
