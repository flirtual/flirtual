import type { WretchOptions } from "wretch";

import { development } from "~/const";

import { api } from "./common";
import type { DatedModel, UuidModel } from "./common";

export const SubscriptionFeatures = ["custom_weights"] as const;
export type SubscriptionFeature = (typeof SubscriptionFeatures)[number];

export type Plan = {
	name: string;
	product: string;
	features: Array<SubscriptionFeature>;
	appleId?: string;
	googleId?: string;
	revenuecatId?: string;
	purchasable: boolean;
	recurring: boolean;
}
& Partial<DatedModel> & UuidModel;

export const Plan = {
	api: api.url("plans"),
	list(locale: string, options: WretchOptions = {}) {
		return this.api
			.options({
				credentials: development ? "include" : "omit",
				next: {
					revalidate: false
				},
				...options
			})
			.query({ locale })
			.get()
			.json<Array<Plan>>();
	}
};
