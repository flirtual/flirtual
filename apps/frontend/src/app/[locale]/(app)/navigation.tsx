"use client";

import type { ComponentProps, FC } from "react";
import { twMerge } from "tailwind-merge";
import { withSuspense } from "with-suspense";

import { HeartIcon } from "~/components/icons/gradient/heart";
import { HomeIcon } from "~/components/icons/gradient/home";
import { LoginIcon } from "~/components/icons/gradient/login";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { useOptionalSession } from "~/hooks/use-session";
import { urls } from "~/urls";

import { NavigationalSwitchItem } from "./navigation-item";
import { NavigationItemMessage } from "./navigation-item-message";
import { NavigationItemProfile } from "./navigation-item-profile";

const NavigationalSwitch: FC<ComponentProps<"div">> = ({
	children,
	...elementProps
}) => (
	<div className="relative">
		<div
			{...elementProps}
			className={twMerge(
				"isolate flex gap-4 rounded-full bg-white-10 p-2 shadow-brand-inset dark:bg-black-70",
				elementProps.className
			)}
		>
			{children}
		</div>
	</div>
);

const GuestNavigationItems: FC = () => (
	<NavigationalSwitch>
		<NavigationalSwitchItem
			className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
			href={urls.landing}
			Icon={HomeIcon}
		/>
		<NavigationalSwitchItem
			className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
			href={urls.login()}
			Icon={LoginIcon}
			strict={false}
		/>
	</NavigationalSwitch>

);

const guestNavigationItems = <GuestNavigationItems />;

const NavigationContent = withSuspense(() => {
	const session = useOptionalSession();
	if (!session) return guestNavigationItems;

	return (
		<>
			<NavigationItemProfile />
			<NavigationalSwitch id="browse-mode-switch">
				<NavigationalSwitchItem
					href={urls.discover("love")}
					Icon={HeartIcon}
					id="date-mode-switch"
				/>
				<NavigationalSwitchItem
					href={urls.discover("friends")}
					Icon={PeaceIcon}
					id="homie-mode-switch"
				/>
			</NavigationalSwitch>
			<NavigationItemMessage />
		</>
	);
}, {
	fallback: guestNavigationItems
});

export function Navigation() {
	return (
		<header className="sticky bottom-0 z-50 order-last flex w-screen flex-col items-center justify-center bg-brand-gradient text-white-20 shadow-brand-1 vision:hidden desktop:bottom-auto desktop:top-0 desktop:order-none">
			<div className="flex size-full items-center justify-evenly gap-4 px-5 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.625rem),0.5rem)] pt-2 font-nunito text-white-20 desktop:w-auto desktop:pb-2">
				<NavigationContent />
			</div>
		</header>
	);
}
