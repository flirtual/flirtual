import { DatedModel, UuidModel } from "./common";

export const SubscriptionFeatures = ["custom_weights"] as const;
export type SubscriptionFeature = (typeof SubscriptionFeatures)[number];

export type Plan = UuidModel &
	Partial<DatedModel> & {
		name: string;
		features: Array<SubscriptionFeature>;
		productId?: string;
		priceId?: string;
	};
