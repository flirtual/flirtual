import type { WretchOptions } from "wretch";

import { development } from "~/const";

import { api } from "./common";

export interface Timezone {
	id: string;
	// Seconds from UTC right now, so it follows daylight saving.
	offset: number;
	// Legacy names that resolve to this zone, as a browser may report them.
	aliases?: Array<string>;
}

export function listTimezones(options: WretchOptions = {}): Promise<Array<Timezone>> {
	return api
		.url("timezones")
		.options({ credentials: development ? "include" : "omit", ...options })
		.get()
		.json<Array<Timezone>>();
}
