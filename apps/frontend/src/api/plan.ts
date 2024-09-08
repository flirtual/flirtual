import { gitCommitSha } from "~/const";
import { cache } from "~/cache";

import { api, type DatedModel, type UuidModel } from "./common";

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

export const Plan = {
	api: api.url("plans"),
	list() {
		return cache.global(
			() =>
				this.api
					.options({ credentials: "omit" })
					.query({ v: gitCommitSha })
					.get()
					.json<Array<Plan>>(),
			{
				key: [gitCommitSha],
				revalidate: false
			}
		);
	}
};
