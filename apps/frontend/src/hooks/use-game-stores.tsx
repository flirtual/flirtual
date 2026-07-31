import { useCallback, useMemo } from "react";

import type { GameStore, MinimalAttribute } from "~/api/attributes";
import { attributeId, gameStores } from "~/api/attributes";
import type { GameStoreLink } from "~/components/game-stores";
import { GameStoreLinks } from "~/components/game-stores";
import type { InputAutocompleteOption } from "~/components/inputs/autocomplete";
import { useLocale } from "~/i18n";

import { useAttributes, useAttributeTranslation } from "./use-attribute";
import { useOptionalSession } from "./use-session";

const storePlatforms: Record<GameStore, string> = {
	pcvr: "3Kagenz7boB64Ke6vEAKv6",
	frame: "Ry723pMCrWV4ptp8ywcorG",
	horizon: "RNaigbGdB7H4ZMw5c8ysbi",
	pico: "FEX8jjr4P9aeBurRUTLhU7",
	vive: "N458aYKyg6hweVbyDEMDAR",
	androidxr: "Qb3Ar9wqh7mAMwdevJCfYS",
	vision: "c255sGSiJpMNnm6NTUcvx6",
	psvr: "n6sSShVCXahjazwqEraKCG"
};

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

function useGamesById(): Map<string, MinimalAttribute<"game">> {
	const games = useAttributes("game");

	return useMemo(
		() => new Map(games.map((game) => [attributeId(game), game])),
		[games]
	);
}

// Stores belonging to a set of platform attributes, in canonical order.
function useGameStores(platforms: Array<string> | undefined): Array<GameStore> {
	return useMemo(
		() => gameStores.filter((store) => platforms?.includes(storePlatforms[store])),
		[platforms]
	);
}

// Stores matching the platforms on the signed-in user's saved profile.
export function useSessionGameStores(): Array<GameStore> {
	const session = useOptionalSession();
	return useGameStores(session?.user.profile.attributes.platform);
}

export function useGameStoreLinks(
	stores: ReadonlyArray<GameStore> = gameStores
): (gameId: string) => Array<GameStoreLink> {
	const games = useGamesById();
	const tAttribute = useAttributeTranslation();
	const [locale] = useLocale();

	return useCallback(
		(gameId) => {
			const game = games.get(gameId);
			if (!game || typeof game === "string") return [];

			return stores
				.map((store) => {
					const href = game[store];
					if (!href) return null;

					const platform = storePlatforms[store];
					return {
						store,
						href: localizedStoreUrls[href]?.[locale] ?? href,
						name: tAttribute[platform]?.name ?? platform
					};
				})
				.filter(Boolean);
		},
		[games, locale, stores, tAttribute]
	);
}

// Games, labelled and carrying their store links, with those available on
// `platforms` ordered first.
export function useGameOptions(
	platforms: Array<string>
): Array<InputAutocompleteOption> {
	const games = useAttributes("game");
	const tAttribute = useAttributeTranslation();

	const stores = useGameStores(platforms);
	const allLinks = useGameStoreLinks();
	const supportedLinks = useGameStoreLinks(stores);

	return useMemo(
		() =>
			games
				.map((game) => {
					const id = attributeId(game);
					return { id, supported: supportedLinks(id).length > 0 };
				})
				.sort((a, b) => Number(b.supported) - Number(a.supported))
				.map(({ id }) => ({
					key: id,
					label: tAttribute[id]?.name ?? id,
					suffix: <GameStoreLinks links={allLinks(id)} />
				})),
		[games, tAttribute, allLinks, supportedLinks]
	);
}
