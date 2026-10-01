import { Suspense } from "react";
import { Outlet } from "react-router";

import { Footer } from "~/components/layout/footer";
import { TalkjsProvider } from "~/hooks/use-talkjs";
import { RedirectBoundary } from "~/redirect";

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
					className="flex min-h-[calc(100svh-max(calc(var(--safe-area-inset-bottom,0rem)+4.5rem),5rem))] w-full grow flex-col items-center pl-[var(--content-inset-left,0rem)] pr-[var(--content-inset-right,0rem)] native-nav:min-h-[calc(100svh-var(--safe-area-inset-bottom,0rem))] desktop:py-8 desktop:pl-[calc(2rem+var(--content-inset-left,0rem))] desktop:pr-[calc(2rem+var(--content-inset-right,0rem))]"
					// vaul-drawer-wrapper=""
				>
					<RedirectBoundary>
						<Outlet />
					</RedirectBoundary>
				</div>
				<Footer desktopOnly />
			</>
		</TalkjsProvider>
	);
}
