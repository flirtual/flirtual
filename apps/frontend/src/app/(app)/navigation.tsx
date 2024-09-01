import { NavigationInner } from "~/components/layout/navigation/inner";
import { getOptionalSession } from "~/server-utilities";

export async function Navigation() {
	const session = await getOptionalSession();

	return (
		<header className="sticky bottom-0 z-50 order-last flex w-screen flex-col text-white-20 vision:hidden desktop:bottom-auto desktop:top-0 desktop:order-none">
			<div className="z-10 flex w-full flex-col items-center justify-center bg-brand-gradient shadow-brand-1">
				<NavigationInner user={session?.user} />
			</div>
		</header>
	);
}
