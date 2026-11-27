import { queryOptions, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { byId, gamesOptions, platformsOptions } from "~/api/data";
import type { DataEntry } from "~/api/data";
import type { GameStoreLink } from "~/components/game-stores";
import { GameStoreLinks } from "~/components/game-stores";
import type { InputAutocompleteOption } from "~/components/inputs/autocomplete";
import { useLocale } from "~/i18n";

import { useOptionalSession } from "./use-session";

const storePlatforms = {
	pcvr: "pcvr",
	horizon: "meta_quest",
	frame: "steam_frame",
	pico: "pico",
	vive: "vive_standalone",
	androidxr: "android_xr",
	vision: "apple_vision",
	psvr: "playstation_vr"
} as const satisfies Partial<Record<keyof DataEntry<"games">, string>>;

export type GameStore = keyof typeof storePlatforms;

export const gameStores = Object.keys(storePlatforms) as Array<GameStore>;

const localizedStoreUrls: Record<string, Record<string, string>> = {
	"https://cluster.mu/en/downloads": {
		es: "https://cluster.mu/es/downloads",
		ja: "https://cluster.mu/downloads",
		ko: "https://cluster.mu/ko/downloads"
	},
	"https://cloud.vket.com/en/": {
		ja: "https://cloud.vket.com/ja/"
	}
};

function useGameStores(platforms: Array<string> | undefined): Array<GameStore> {
	return useMemo(
		() => gameStores.filter((store) => platforms?.includes(storePlatforms[store])),
		[platforms]
	);
}

// Stores matching the platforms on the signed-in user's saved profile.
export function useSessionGameStores(): Array<GameStore> {
	const session = useOptionalSession();
	return useGameStores(session?.user.profile.platforms);
}

export function useGameStoreLinks(
	stores: ReadonlyArray<GameStore> = gameStores
): (gameId: string) => Array<GameStoreLink> {
	const [locale] = useLocale();
	const [{ data: games }, { data: platforms }] = useSuspenseQueries({
		queries: [
			queryOptions({ ...gamesOptions({ locale }), select: byId }),
			queryOptions({ ...platformsOptions({ locale }), select: byId })
		]
	});

	return useCallback(
		(gameId) => {
			const game = games[gameId];
			if (!game) return [];

			return stores
				.map((store) => {
					const href = game[store];
					if (!href) return null;

					const platform = storePlatforms[store];
					return {
						store,
						href: localizedStoreUrls[href]?.[locale] ?? href,
						name: platforms[platform]?.name ?? platform
					};
				})
				.filter(Boolean);
		},
		[games, locale, stores, platforms]
	);
}

// Games, labelled and carrying their store links, with those available on
// `platforms` ordered first.
export function useGameOptions(
	platforms: Array<string>
): Array<InputAutocompleteOption> {
	const [locale] = useLocale();
	const { data: games } = useSuspenseQuery(gamesOptions({ locale }));

	const stores = useGameStores(platforms);
	const allLinks = useGameStoreLinks();
	const supportedLinks = useGameStoreLinks(stores);

	return useMemo(
		() =>
			games
				.map(({ id, name }) => ({ id, name, supported: supportedLinks(id).length > 0 }))
				.sort((a, b) => Number(b.supported) - Number(a.supported))
				.map(({ id, name }) => ({
					key: id,
					label: name,
					suffix: <GameStoreLinks links={allLinks(id)} />
				})),
		[games, allLinks, supportedLinks]
	);
}
