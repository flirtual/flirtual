import { Suspense } from "react";
import { Outlet } from "react-router";

import { Footer } from "~/components/layout/footer";
import { TalkjsProvider } from "~/hooks/use-talkjs";

import { AppBanner } from "./banner";
import { Navigation } from "./navigation";

export default function AppLayout() {
	return (
		<TalkjsProvider>
			<>
				<Suspense>
					<AppBanner />
				</Suspense>
				<Navigation />
				<div
					className="flex min-h-[calc(100svh-max(calc(var(--safe-area-inset-bottom,0rem)+4.5rem),5rem))] w-full grow flex-col items-center desktop:p-8"
					// vaul-drawer-wrapper=""
				>
					<Outlet />
				</div>
				<Footer desktopOnly />
			</>
		</TalkjsProvider>
	);
}
