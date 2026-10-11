import { useEffect } from "react";
import { Outlet } from "react-router";

import { hideNativeNavigation } from "~/native-navigation";
import { RedirectBoundary } from "~/redirect";

export default function MinimalLayout() {
	// Pads itself clear of the sides, so headers can run beneath them.
	useEffect(() => {
		hideNativeNavigation({ edgeToEdge: true });
		return () => hideNativeNavigation();
	}, []);

	return (
		<div className="flex min-h-screen w-full grow flex-col items-center overflow-x-clip pl-[var(--content-inset-left)] pr-[var(--content-inset-right)] [--content-inset-left:var(--safe-area-inset-left,0px)] [--content-inset-right:var(--safe-area-inset-right,0px)] [--top-clearance-left:var(--content-inset-left)] [--top-clearance-right:var(--content-inset-right)] desktop:flex-col desktop:p-8">
			<RedirectBoundary>
				<Outlet />
			</RedirectBoundary>
		</div>
	);
}
