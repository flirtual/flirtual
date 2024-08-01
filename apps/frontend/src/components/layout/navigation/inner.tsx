"use client";

import { twMerge } from "tailwind-merge";

import { AuthenticatedNavigation, GuestNavigation } from ".";

import type { ComponentProps, FC } from "react";
import type { User } from "~/api/user";

export type NavigationInnerProps = ComponentProps<"div"> & {
	user?: User;
};

export const NavigationInner: FC<NavigationInnerProps> = (props) => {
	const { user, ...elementProps } = props;

	return (
		<div
			{...elementProps}
			className={twMerge(
				"flex size-full items-center justify-evenly gap-4 px-5 pb-[max(calc(env(safe-area-inset-bottom,0rem)-0.625rem),0.5rem)] pt-2 font-nunito text-white-20 desktop:w-auto desktop:pb-2",
				props.className
			)}
		>
			{user ? <AuthenticatedNavigation /> : <GuestNavigation />}
		</div>
	);
};
