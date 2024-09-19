import { twMerge } from "tailwind-merge";

import { urls } from "~/urls";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { HomeIcon } from "~/components/icons/gradient/home";
import { LoginIcon } from "~/components/icons/gradient/login";
import { Authentication } from "~/api/auth";

import { NavigationItemProfile } from "./navigation-item-profile";
import { NavigationItemMessage } from "./navigation-item-message";
import { NavigationalSwitchItem } from "./navigation-item";

import type { ComponentProps, FC } from "react";

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
				<div className="flex size-full items-center justify-evenly gap-4 px-5 pb-[max(calc(env(safe-area-inset-bottom,0rem)-0.625rem),0.5rem)] pt-2 font-nunito text-white-20 desktop:w-auto desktop:pb-2">
					{session ? (
						<>
							<NavigationItemProfile />
							<NavigationalSwitch id="browse-mode-switch">
								<NavigationalSwitchItem
									href={urls.browse()}
									icon={
										<HeartIcon className="fill-[var(--fill)] group-data-[active]:fill-current" />
									}
									className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
								/>
								<NavigationalSwitchItem
									href={urls.browse("friend")}
									icon={
										<PeaceIcon className="fill-[var(--fill)] group-data-[active]:fill-current" />
									}
									className="data-[active]:bg-brand-gradient-green hocus:bg-brand-gradient-green"
								/>
							</NavigationalSwitch>
							<NavigationItemMessage />
						</>
					) : (
						<NavigationalSwitch>
							<NavigationalSwitchItem
								href={urls.default}
								icon={<HomeIcon />}
								className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
							/>
							<NavigationalSwitchItem
								href={urls.login()}
								icon={
									<LoginIcon className="fill-[var(--fill)] group-data-[active]:fill-current" />
								}
								className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
							/>
						</NavigationalSwitch>
					)}
				</div>
			</div>
		</header>
	);
}
