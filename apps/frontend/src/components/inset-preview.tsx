import { environment } from "~/const";

import type { FC } from "react";

export const InsetPreview: FC = () => {
	if (environment !== "development") return null;

	return (
		<div className="contents">
			<div className="bg--50/50 fixed left-0 top-0 isolate z-[999] h-[var(--safe-area-inset-top,env(safe-area-inset-top))] w-screen" />
			<div className="bg--50/50 fixed right-0 top-0 isolate z-[999] h-screen w-[var(--safe-area-inset-right,env(safe-area-inset-right))]" />
			<div className="bg--50/50 fixed bottom-0 left-0 isolate z-[999] h-[var(--safe-area-inset-bottom,env(safe-area-inset-bottom))] w-screen" />
			<div className="bg--50/50 fixed left-0 top-0 isolate z-[999] h-screen w-[var(--safe-area-inset-left,env(safe-area-inset-left))]" />
		</div>
	);
};
