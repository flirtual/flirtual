import { Footer } from "~/components/layout/footer";

import { Navigation } from "./navigation";

import type { PropsWithChildren, ReactNode } from "react";

export default function AppLayout({
	children,
	banner
}: PropsWithChildren<{
	banner: ReactNode;
}>) {
	return (
		<>
			<div className="flex min-h-screen grow flex-col items-center bg-white-20 font-nunito text-black-80 vision:bg-transparent dark:bg-black-70 dark:text-white-20 desktop:flex-col desktop:bg-cream desktop:dark:bg-black-80">
				{banner}
				<Navigation />
				<div
					className="max-w-screen-lg flex min-h-[calc(100svh-max(calc(env(safe-area-inset-bottom,0rem)+4.5rem),5rem))] w-full grow flex-col items-center desktop:p-8"
					// vaul-drawer-wrapper=""
				>
					{children}
				</div>
				<Footer desktopOnly />
			</div>
		</>
	);
}
