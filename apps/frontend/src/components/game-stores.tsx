import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import type { GameStore } from "~/api/attributes";

import type { IconComponent } from "./icons";
import {
	AndroidIcon,
	AppleIcon,
	MetaIcon,
	OculusIcon,
	PicoIcon,
	PlayStationIcon,
	SteamFrameIcon,
	SteamIcon,
	ViveIcon
} from "./icons";
import { Link } from "./link";

const storeIcons: Record<GameStore, IconComponent> = {
	pcvr: SteamIcon,
	horizon: MetaIcon,
	frame: SteamFrameIcon,
	pico: PicoIcon,
	vive: ViveIcon,
	androidxr: AndroidIcon,
	vision: AppleIcon,
	psvr: PlayStationIcon
};

const metaStore = /^https?:\/\/(?:[^./]+\.)?meta\.com\//;

const storeColors: Record<GameStore, string> = {
	pcvr: "hocus:text-black-90 dark:hocus:text-white-10",
	horizon:
		"hocus:text-[#0081fb] hocus:[--brand-2:url(#meta-arc)] hocus:[--brand-3:url(#meta-tail)]",
	frame: "hocus:text-black-90 hocus:[--brand-2:#1a9fff] dark:hocus:text-white-10",
	pico: "hocus:text-black-90 dark:hocus:text-white-10",
	vive: "hocus:text-[#00b2e3]",
	androidxr: "hocus:text-[#32de84]",
	vision: "hocus:text-black-90 dark:hocus:text-white-10",
	psvr: "hocus:text-black-90 dark:hocus:text-white-10"
};

const monochromeStores = new Set<GameStore>([
	"pcvr",
	"frame",
	"pico",
	"vision",
	"psvr"
]);

export interface GameStoreLink {
	store: GameStore;
	href: string;
	name: string;
}

export const GameStoreLinks: FC<{
	links: Array<GameStoreLink>;
	className?: string;
	overlay?: boolean;
	stretched?: boolean;
}> = ({ links, className, overlay = false, stretched = false }) => {
	if (links.length === 0) return null;

	return (
		<div className={twMerge("flex shrink-0 items-center gap-2", className)}>
			{links.map(({ store, href, name }, index) => {
				const Icon = store === "pcvr" && metaStore.test(href)
					? OculusIcon
					: storeIcons[store];
				const first = index === 0;
				const last = index === links.length - 1;

				return (
					<Link
						key={store}
						className={twMerge(
							"focusable rounded-sm opacity-60 transition-opacity before:absolute hocus:opacity-100",
							storeColors[store],
							overlay && monochromeStores.has(store) && "hocus:text-white-10",
							// Increased hover area. The first mark's hover area fills the left part
							// of the pill.
							stretched && first
								? "before:inset-0 before:rounded-xl"
								: twMerge(
										"relative",
										stretched ? "before:-inset-y-2" : "before:-inset-y-3.5",
										first
											? "before:-left-3.5 before:-right-1"
											: "before:-inset-x-1",
										last && "before:-right-4",
										last && stretched && "before:rounded-r-xl"
									)
						)}
						aria-label={name}
						href={href}
						title={name}
					>
						<Icon className="size-4" />
					</Link>
				);
			})}
		</div>
	);
};
