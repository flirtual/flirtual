import { twMerge } from "tailwind-merge";

import { withOptionalSession } from "~/server-utilities";

import { NavigationInner } from "./navigation/inner";
import { HeaderBanner } from "./header-banner";

export async function Header({ className }: { className?: string }) {
	const session = await withOptionalSession();

	return (
		<div
			className={twMerge(
				"sticky bottom-0 z-50 flex w-full flex-col desktop:bottom-auto desktop:top-0",
				className
			)}
		>
			<HeaderBanner />
			<header className="relative flex w-screen flex-col text-white-20 vision:hidden">
				<div className="z-10 flex w-full flex-col items-center justify-center bg-brand-gradient shadow-brand-1">
					<NavigationInner user={session?.user} />
				</div>
			</header>
		</div>
	);
}
