import { environment } from "~/const";

import type { FC } from "react";

export const InsetPreview: FC = () => {
	if (environment !== "development") return null;

	return (
		<>
			<div className="fixed left-0 top-0 isolate z-[999] h-[var(--safe-area-inset-top,env(safe-area-inset-top))] w-screen bg-yellow-500/50" />
			<div className="fixed right-0 top-0 isolate z-[999] h-screen w-[var(--safe-area-inset-right,env(safe-area-inset-right))] bg-yellow-500/50" />
			<div className="fixed bottom-0 left-0 isolate z-[999] h-[var(--safe-area-inset-bottom,env(safe-area-inset-bottom))] w-screen bg-yellow-500/50" />
			<div className="fixed left-0 top-0 isolate z-[999] h-screen w-[var(--safe-area-inset-left,env(safe-area-inset-left))] bg-yellow-500/50" />
		</>
	);
};
