import { DatedModel, UuidModel } from "../common";

export type SubscriptionType = "premium" | "supporter" | "lifetime_premium";

export type Subscription = UuidModel &
	DatedModel & {
		type: SubscriptionType;
		cancelledAt: string | null;
	};
