import type { WretchOptions } from "wretch";

import type { AttributeType } from "./attributes";
import { api } from "./common";
import type { ConnectionType } from "./connections";

export interface Config {
	country: string | null;
	// Digest per attribute type, versions attribute urls for cache busting
	attributes: Partial<Record<AttributeType, string>>;
	loginProviders: Array<LoginProvider>;
}

export type LoginProvider = "email" | ConnectionType;

export const Config = {
	api: api.url("config"),
	get(options: WretchOptions = {}) {
		return this.api
			.options(options)
			.get()
			.json<Config>();
	}
};
