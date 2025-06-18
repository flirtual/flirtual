import type { WretchOptions } from "wretch";

import { api } from "./common";

export interface Config {
}

export interface DeviceConfig {
	country: string | null;
}

export const Config = {
	api: api.url("config"),
	get(options: WretchOptions = {}) {
		return this.api
			.options(options)
			.get()
			.json<Config>();
	},
	getDevice(options: WretchOptions = {}) {
		return api
			.url("device")
			.options(options)
			.get()
			.json<DeviceConfig>();
	},
};
