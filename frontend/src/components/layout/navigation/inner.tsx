import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

import { withSession } from "~/server-utilities";

import { AuthenticatedNavigation, GuestNavigation } from ".";

export async function NavigationInner(props: ComponentProps<"div">) {
	const { user } = await withSession();

	return (
		<div
			{...props}
			className={twMerge(
				"flex h-full w-full max-w-md items-center justify-between gap-4 px-8 font-nunito text-white-20 sm:w-auto",
				props.className
			)}
		>
			{user ? <AuthenticatedNavigation /> : <GuestNavigation />}
		</div>
	);
}
