import { NavigationInner } from "./inner";

export async function MobileBarNavigation() {
	return (
		<nav className="flex h-16 w-full sm:hidden sm:pt-0">
			<div className="fixed bottom-0 z-40 flex h-16 w-full items-center justify-center bg-brand-gradient shadow-brand-1">
				{/* @ts-expect-error: Server Component */}
				<NavigationInner />
			</div>
		</nav>
	);
}
