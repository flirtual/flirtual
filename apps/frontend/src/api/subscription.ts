import { DatedModel, UuidModel } from "./common";
import { newUrl } from "./exports";
import { Plan } from "./plan";

export type Subscription = UuidModel &
	DatedModel & {
		active: boolean;
		plan: Plan;
		cancelledAt?: string;
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
