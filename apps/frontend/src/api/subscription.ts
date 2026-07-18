import { api } from "./common";
import type { DatedModel, UuidModel } from "./common";
import type { Plan } from "./plan";

export type EntitlementKind = "consumable" | "one_time" | "subscription";

export type EntitlementStore
	= | "app_store"
		| "chargebee"
		| "play_store"
		| "promotional"
		| "stripe";

export type Entitlement = {
	kind: EntitlementKind;
	store: EntitlementStore;
	active: boolean;
	plan: Plan;
	entitledUntil?: string;
	renews?: boolean;
	renewalPending?: boolean;
	quantity?: number;
}
& DatedModel & UuidModel;

export interface ChargebeeHostedPage {
	id: string;
	type: string;
	url: string;
	state: string;
	embed: boolean | string | null;
	createdAt: number;
	expiresAt: number;
	object: "hosted_page";
}

export interface ChargebeePortalSession {
	id: string;
	token: string;
	accessUrl: string;
	status: string;
	customerId: string;
	redirectUrl: string;
	createdAt: number;
	expiresAt: number;
	linkedCustomers: Array<unknown>;
	object: "portal_session";
}

export const Subscription = {
	api: api.url("subscriptions"),
	checkout(planId: string) {
		return this.api.url("/checkout").query({ plan_id: planId }).get().json<ChargebeeHostedPage>();
	},
	manage() {
		return this.api.url("/manage").get().json<ChargebeePortalSession>();
	}
};
