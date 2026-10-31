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
					className="flex min-h-[calc(100svh-max(calc(var(--safe-area-inset-bottom,0rem)+4.5rem),5rem))] w-full grow flex-col items-center pr-(--content-inset-right,0rem) pl-(--content-inset-left,0rem) native-nav:min-h-[calc(100svh-var(--safe-area-inset-bottom,0rem))] split:native-nav:min-h-svh desktop:py-8 desktop:pr-[calc(2rem+var(--content-inset-right,0rem))] desktop:pl-[calc(2rem+var(--content-inset-left,0rem))] [[data-banner]~&]:mt-[min(0px,calc(0.5rem-var(--safe-area-inset-top,0rem)))] desktop:[[data-banner]~&]:mt-0"
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
