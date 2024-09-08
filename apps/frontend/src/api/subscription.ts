import { api, type DatedModel, type UuidModel } from "./common";

import type { Plan } from "./plan";

type SubscriptionPlatform =
	| "stripe"
	| "chargebee"
	| "android"
	| "ios"
	| "unknown";

export type Subscription = UuidModel &
	DatedModel & {
		active: boolean;
		plan: Plan;
		cancelledAt?: string;
		platform: SubscriptionPlatform;
	};

export const Subscription = {
	api: api.url("subscriptions"),
	checkoutUrl(planId: string) {
		return this.api.url("/checkout").query({ planId })._url;
	},
	manageUrl() {
		return this.api.url("/manage")._url;
	},
	cancel() {
		return this.api.post().res();
	}
};
