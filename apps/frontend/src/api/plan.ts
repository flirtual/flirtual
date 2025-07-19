import { cache } from "react";

import { gitCommitSha } from "~/const";

import { api } from "./common";
import type { DatedModel, UuidModel } from "./common";

export const SubscriptionFeatures = ["custom_weights"] as const;
export type SubscriptionFeature = (typeof SubscriptionFeatures)[number];

export type Plan = {
	name: string;
	features: Array<SubscriptionFeature>;
	productId?: string;
	priceId?: string;
	appleId?: string;
	googleId?: string;
	revenuecatId?: string;
	purchasable: boolean;
}
& Partial<DatedModel> & UuidModel;

export const Plan = {
	api: api.url("plans"),
	list() {
		return this.api
			.options({
				credentials: "omit",
				next: {
					revalidate: false
				}
			})
			.query({ v: gitCommitSha })
			.get()
			.json<Array<Plan>>();
	}
};

Plan.list = cache(Plan.list.bind(Plan));
