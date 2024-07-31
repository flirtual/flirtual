import { type NarrowFetchOptions, fetch, newUrl } from "./exports";

import type { DatedModel, UuidModel } from "./common";
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

export interface SessionCheckout {
	url: string;
}

export function checkoutUrl(planId: string) {
	return newUrl("subscriptions/checkout", { planId });
}

export function manageUrl() {
	return newUrl("subscriptions/manage");
}

export async function cancel(options: NarrowFetchOptions = {}) {
	return fetch("post", "subscriptions/cancel", options);
}
