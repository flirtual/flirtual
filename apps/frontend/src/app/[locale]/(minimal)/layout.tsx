import { type PropsWithChildren, Suspense } from "react";

import { LoadingIndicator } from "../(app)/loading-indicator";

export default function MinimalLayout({ children }: PropsWithChildren) {
	return (
		<div className="flex min-h-screen w-full grow flex-col items-center desktop:flex-col desktop:p-8">
			<Suspense fallback={<LoadingIndicator className="absolute inset-0" />}>
				{children}
			</Suspense>
		</div>
	);
}
