import type { WretchOptions } from "wretch";

import { api } from "./common";
import type { ConnectionType } from "./connections";

export interface Config {
	country: string | null;
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
