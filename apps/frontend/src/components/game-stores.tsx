import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import type { GameStore } from "~/api/attributes";

import type { IconComponent } from "./icons";
import {
	AndroidIcon,
	AppleIcon,
	MetaIcon,
	PicoIcon,
	PlayStationIcon,
	SteamFrameIcon,
	SteamIcon,
	ViveIcon
} from "./icons";
import { Link } from "./link";

const storeIcons: Record<GameStore, IconComponent> = {
	pcvr: SteamIcon,
	frame: SteamFrameIcon,
	horizon: MetaIcon,
	pico: PicoIcon,
	vive: ViveIcon,
	androidxr: AndroidIcon,
	vision: AppleIcon,
	psvr: PlayStationIcon
};

export interface GameStoreLink {
	store: GameStore;
	href: string;
	name: string;
}

export const GameStoreLinks: FC<{
	links: Array<GameStoreLink>;
	className?: string;
}> = ({ links, className }) => {
	if (links.length === 0) return null;

	return (
		<div className={twMerge("flex shrink-0 items-center gap-2", className)}>
			{links.map(({ store, href, name }) => {
				const Icon = storeIcons[store];

				return (
					<Link
						key={store}
						aria-label={name}
						className="focusable rounded-sm opacity-60 transition-opacity hocus:opacity-100"
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
