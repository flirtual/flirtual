import type { ComponentProps, FC } from "react";
import { twMerge } from "tailwind-merge";

import { HeartIcon } from "~/components/icons/gradient/heart";
import { HomeIcon } from "~/components/icons/gradient/home";
import { LoginIcon } from "~/components/icons/gradient/login";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { environment } from "~/const";
import { device } from "~/hooks/use-device";
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

const NavigationContent: FC = () => {
	const session = useOptionalSession();

	if (!session)
		return (
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

	return (
		<>
			<NavigationItemProfile />
			<NavigationalSwitch id="browse-mode-switch">
				<NavigationalSwitchItem
					href={urls.discover("dates")}
					Icon={HeartIcon}
					id="date-mode-switch"
				/>
				<NavigationalSwitchItem
					href={urls.discover("homies")}
					Icon={PeaceIcon}
					id="homie-mode-switch"
				/>
			</NavigationalSwitch>
			<NavigationItemMessage />
		</>
	);
};

export function Navigation() {
	const { deviceId, userAgent, native, versions: { commit, version } } = device;

	return (
		<header className="sticky bottom-0 z-50 order-last flex w-screen flex-col items-center justify-center bg-brand-gradient text-white-20 shadow-brand-1 vision:hidden desktop:bottom-auto desktop:top-0 desktop:order-none">
			{environment === "preview" && (
				<div className="pointer-events-none absolute bottom-20 flex max-w-lg flex-col items-center justify-center px-4 text-center text-xs opacity-75 desktop:bottom-[unset] desktop:top-24">
					<span>{deviceId}</span>
					<span>{userAgent}</span>
					<span>{`${commit}`}</span>
					{native && (
						<span>
							v
							{version}
						</span>
					)}
				</div>
			)}
			<div className="flex size-full items-center justify-evenly gap-4 px-5 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.625rem),0.5rem)] pt-2 font-nunito text-white-20 desktop:w-auto desktop:pb-2">
				<NavigationContent />
			</div>
		</header>
	);
}
