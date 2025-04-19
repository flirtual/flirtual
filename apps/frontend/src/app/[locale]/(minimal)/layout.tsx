import type { PropsWithChildren } from "react";

export default function MinimalLayout({ children }: PropsWithChildren) {
	return (
		<div className="flex min-h-screen w-full grow flex-col items-center desktop:flex-col desktop:p-8">
			{children}
		</div>
	);
}
