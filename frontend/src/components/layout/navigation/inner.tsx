import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

import { withOptionalSession } from "~/server-utilities";

import { AuthenticatedNavigation, GuestNavigation } from ".";

export async function NavigationInner(props: ComponentProps<"div">) {
	const session = await withOptionalSession();

	return (
		<div
			{...props}
			className={twMerge(
				"flex h-full w-full items-center justify-evenly gap-4 px-4 font-nunito text-white-20 sm:w-auto",
				props.className
			)}
		>
			{session?.user ? <AuthenticatedNavigation /> : <GuestNavigation />}
		</div>
	);
}
