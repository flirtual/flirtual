import type { WretchOptions } from "wretch";

import { api } from "./common";

export interface Config {
	country: string | null;
}

export const Config = {
	api: api.url("config"),
	get(options: WretchOptions = {}) {
		return this.api
			.options(options)
			.get()
			.json<Config>();
	}
};
