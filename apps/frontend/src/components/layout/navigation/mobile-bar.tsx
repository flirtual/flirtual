import { withOptionalSession } from "~/server-utilities";

import { NavigationInner } from "./inner";

export async function MobileBarNavigation() {
	const session = await withOptionalSession();

	return (
		<nav className="flex h-16 w-full sm:hidden sm:pt-0">
			<div className="fixed bottom-0 z-40 flex w-full items-center justify-center bg-brand-gradient py-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] shadow-brand-1">
				<NavigationInner user={session?.user} />
			</div>
		</nav>
	);
}
