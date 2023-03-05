import { fetch, NarrowFetchOptions } from "../..";

import { Profile } from "./profile";

export const CustomWeightList = [
	"country",
	"monopoly",
	"games",
	"defaultInterests",
	"customInterests",
	"personality",
	"serious",
	"domsub",
	"kinks",
	"likes"
] as const;

export type CustomWeight = (typeof CustomWeightList)[number];

export type ProfileCustomWeights = {
	[K in CustomWeight]: number;
};

export const DefaultProfileCustomWeights = Object.freeze<ProfileCustomWeights>(
	Object.fromEntries(CustomWeightList.map((key) => [key, 1])) as ProfileCustomWeights
);

export async function updateCustomWeights(
	userId: string,
	options: NarrowFetchOptions<Partial<ProfileCustomWeights>>
) {
	return fetch<Profile>("post", `users/${userId}/profile/custom-weights`, options);
}
