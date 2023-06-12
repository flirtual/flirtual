"use client";

import { ComponentProps, FC } from "react";
import { twMerge } from "tailwind-merge";

import { User } from "~/api/user";
import { useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";

import { AuthenticatedNavigation, GuestNavigation } from ".";

export type NavigationInnerProps = ComponentProps<"div"> & {
	desktopView?: boolean;
	user?: User;
};

export const NavigationInner: FC<NavigationInnerProps> = (props) => {
	const { user, desktopView = false, ...elementProps } = props;
	const mobileBreakpoint = !useScreenBreakpoint("sm");

	if (desktopView && mobileBreakpoint) return null;

	return (
		<div
			{...elementProps}
			// eslint-disable-next-line tailwindcss/no-custom-classname
			className={twMerge(
				"flex h-full w-full items-center justify-evenly gap-4 px-4 font-nunito text-white-20 sm:w-auto",
				desktopView && "desktop-view",
				props.className
			)}
		>
			{user ? <AuthenticatedNavigation /> : <GuestNavigation />}
		</div>
	);
};
