import { useEffect } from "react";
import { Outlet } from "react-router";

import { hideNativeNavigation } from "~/native-navigation";
import { RedirectBoundary } from "~/redirect";

export default function MinimalLayout() {
	useEffect(hideNativeNavigation, []);

	return (
		<div className="flex min-h-screen w-full grow flex-col items-center overflow-x-clip desktop:flex-col desktop:p-8">
			<RedirectBoundary>
				<Outlet />
			</RedirectBoundary>
		</div>
	);
}
