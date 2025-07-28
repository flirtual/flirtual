import { api } from "./common";
import type { DatedModel, UuidModel } from "./common";
import type { Plan } from "./plan";

type SubscriptionPlatform
	= | "android"
		| "chargebee"
		| "ios"
		| "stripe"
		| "unknown";

export type Subscription = {
	active: boolean;
	plan: Plan;
	cancelledAt?: string;
	platform: SubscriptionPlatform;
}
& DatedModel & UuidModel;

export const Subscription = {
	api: api.url("subscriptions"),
	checkoutUrl(planId: string) {
		return this.api.url("/checkout").query({ plan_id: planId })._url;
	},
	manageUrl() {
		return this.api.url("/manage")._url;
	},
	cancel() {
		return this.api.post().res();
	}
};
