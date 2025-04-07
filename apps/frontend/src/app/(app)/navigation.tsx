import type { ComponentProps, FC } from "react";
import { twMerge } from "tailwind-merge";

import { Authentication } from "~/api/auth";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { HomeIcon } from "~/components/icons/gradient/home";
import { LoginIcon } from "~/components/icons/gradient/login";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { urls } from "~/urls";

import { NavigationalSwitchItem } from "./navigation-item";
import { NavigationItemMessage } from "./navigation-item-message";
import { NavigationItemProfile } from "./navigation-item-profile";

const NavigationalSwitch: FC<ComponentProps<"div">> = ({
	children,
	...elementProps
}) => (
	<div
		{...elementProps}
		className={twMerge(
			"flex gap-4 rounded-full bg-white-10 p-2 shadow-brand-inset dark:bg-black-70",
			elementProps.className
		)}
	>
		{children}
	</div>
);

export async function Navigation() {
	const session = await Authentication.getOptionalSession();

	return (
		<header className="sticky bottom-0 z-50 order-last flex w-screen flex-col text-white-20 vision:hidden desktop:bottom-auto desktop:top-0 desktop:order-none">
			<div className="z-10 flex w-full flex-col items-center justify-center bg-brand-gradient shadow-brand-1">
				<div className="flex size-full items-center justify-evenly gap-4 px-5 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.625rem),0.5rem)] pt-2 font-nunito text-white-20 desktop:w-auto desktop:pb-2">
					{session
						? (
								<>
									<NavigationItemProfile />
									<NavigationalSwitch id="browse-mode-switch">
										<NavigationalSwitchItem
											icon={
												<HeartIcon className="fill-[var(--fill)] group-data-[active]:fill-current" />
											}
											className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
											href={urls.browse()}
											id="date-mode-switch"
										/>
										<NavigationalSwitchItem
											icon={
												<PeaceIcon className="fill-[var(--fill)] group-data-[active]:fill-current" />
											}
											className="data-[active]:bg-brand-gradient-green hocus:bg-brand-gradient-green"
											href={urls.browse("friend")}
											id="homie-mode-switch"
										/>
									</NavigationalSwitch>
									<NavigationItemMessage />
								</>
							)
						: (
								<NavigationalSwitch>
									<NavigationalSwitchItem
										className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
										href={urls.landing}
										icon={<HomeIcon />}
									/>
									<NavigationalSwitchItem
										icon={
											<LoginIcon className="group-data-[active]:fill-current" />
										}
										className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
										href={urls.login()}
										strict={false}
									/>
								</NavigationalSwitch>
							)}
				</div>
			</div>
		</header>
	);
}
