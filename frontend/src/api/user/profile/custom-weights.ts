import { fetch, FetchOptions } from "../..";

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

export type CustomWeight = typeof CustomWeightList[number];

export type ProfileCustomWeights = {
	[K in CustomWeight]: number;
};

export const DefaultProfileCustomWeights = Object.freeze<ProfileCustomWeights>(
	Object.fromEntries(CustomWeightList.map((key) => [key, 1])) as ProfileCustomWeights
);

export type UpdateProfileCustomWeights = Partial<ProfileCustomWeights>;

export async function updateCustomWeights(
	userId: string,
	body: UpdateProfileCustomWeights,
	options: FetchOptions = {}
) {
	return fetch<Profile>("post", `users/${userId}/profile/custom-weights`, { ...options, body });
}
