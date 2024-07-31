import { gitCommitSha } from "~/const";

import { fetch, type NarrowFetchOptions } from "./exports";

import type { DatedModel, UuidModel } from "./common";

export const SubscriptionFeatures = ["custom_weights"] as const;
export type SubscriptionFeature = (typeof SubscriptionFeatures)[number];

export type Plan = UuidModel &
	Partial<DatedModel> & {
		name: string;
		features: Array<SubscriptionFeature>;
		productId?: string;
		priceId?: string;
		appleId?: string;
		googleId?: string;
		revenuecatId?: string;
		purchasable: boolean;
	};

export async function list(
	options: NarrowFetchOptions = {}
): Promise<Array<Plan>> {
	return fetch<Array<Plan>>("get", `plans?v=${gitCommitSha}`, options);
}
