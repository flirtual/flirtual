import type { ComponentProps, FC, MouseEvent } from "react";
import { twMerge } from "tailwind-merge";

import { BuildInformation } from "~/components/build";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { HomeIcon } from "~/components/icons/gradient/home";
import { LoginIcon } from "~/components/icons/gradient/login";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { development } from "~/const";
import { useDevice } from "~/hooks/use-device";
import { useHistoryTabs } from "~/hooks/use-history-tabs";
import { useOptionalSession } from "~/hooks/use-session";
import { useTabMemory } from "~/hooks/use-tab-memory";
import { useMatch } from "~/i18n";
import { urls } from "~/urls";

import { NavigationalSwitchItem } from "./navigation-item";
import { NavigationItemMessage } from "./navigation-item-message";
import { NavigationItemProfile } from "./navigation-item-profile";
import { GuestNativeNavigation, NativeNavigation } from "./navigation-native";

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

const tabs = [
	{ id: "dates", href: urls.discover("dates") },
	{ id: "homies", href: urls.discover("homies") },
	{ id: "matches", href: urls.conversations.list() }
];

// In the Android app, these are tabs that return to where they were left, as on iOS.
function useTabs() {
	const { native, android } = useDevice();
	const enabled = native && android;

	const active: Record<string, boolean> = {
		dates: !!useMatch({ path: urls.discover("dates") }),
		homies: !!useMatch({ path: urls.discover("homies") }),
		matches: !!useMatch({ path: urls.conversations.list(), end: false })
	};
	const select = useTabMemory(tabs, enabled ? tabs.find(({ id }) => active[id])?.id : undefined);

	return (id: string) => enabled
		? (event: MouseEvent) => {
				event.preventDefault();
				select(id);
			}
		: undefined;
}

const NavigationContent: FC = () => {
	const session = useOptionalSession();
	const onTab = useTabs();

	if (!session || session.user.ban)
		return (
			<NavigationalSwitch>
				<NavigationalSwitchItem
					className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
					href={urls.landing}
					Icon={HomeIcon}
					iconClassName="group-hocus:fill-white-20"
				/>
				<NavigationalSwitchItem
					className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
					href={urls.login()}
					Icon={LoginIcon}
					iconClassName="group-hocus:fill-white-20"
					strict={false}
				/>
			</NavigationalSwitch>
		);

	return (
		<>
			<NavigationItemProfile />
			<NavigationalSwitch id="browse-mode-switch">
				<NavigationalSwitchItem
					id="date-mode-switch"
					href={urls.discover("dates")}
					Icon={HeartIcon}
					onClick={onTab("dates")}
				/>
				<NavigationalSwitchItem
					id="homie-mode-switch"
					href={urls.discover("homies")}
					Icon={PeaceIcon}
					onClick={onTab("homies")}
				/>
			</NavigationalSwitch>
			<NavigationItemMessage onClick={onTab("matches")} />
		</>
	);
};

export function Navigation() {
	const { nativeNavigation } = useDevice();
	const session = useOptionalSession();
	useHistoryTabs();
	if (nativeNavigation)
		return session && !session.user.ban
			? <NativeNavigation user={session.user} />
			: <GuestNativeNavigation />;

	return (
		<header className="sticky bottom-0 z-30 order-last flex w-screen flex-col items-center justify-center bg-brand-gradient text-white-20 shadow-brand-1 [overflow-anchor:none] vision:hidden desktop:bottom-auto desktop:top-0 desktop:order-none">
			{development && session?.user.tags?.includes("debugger") && <BuildInformation />}
			<div className="flex size-full items-center justify-evenly gap-4 px-5 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.25rem),0.5rem)] pt-2 font-nunito text-white-20 desktop:w-auto desktop:pb-2">
				<NavigationContent />
			</div>
		</header>
	);
}
