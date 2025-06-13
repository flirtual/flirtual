import { type PropsWithChildren, Suspense } from "react";

import { Footer } from "~/components/layout/footer";
import { TalkjsProvider } from "~/hooks/use-talkjs";

import { AppBanner } from "./banner";
import { LoadingIndicator } from "./loading-indicator";
import { Navigation } from "./navigation";

export default function AppLayout({ children }: PropsWithChildren) {
	return (
		<TalkjsProvider>
			<>
				<AppBanner />
				<Navigation />
				<div
					className="flex min-h-[calc(100svh-max(calc(var(--safe-area-inset-bottom,0rem)+4.5rem),5rem))] w-full grow flex-col items-center desktop:p-8"
					// vaul-drawer-wrapper=""
				>
					<Suspense fallback={<LoadingIndicator className="absolute inset-0" />}>
						{children}
					</Suspense>
				</div>
				<Footer desktopOnly />
			</>
		</TalkjsProvider>
	);
}
