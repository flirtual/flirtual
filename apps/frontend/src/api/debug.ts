import { fetch, NarrowFetchOptions } from "./exports";

export async function evaluate(
	options: NarrowFetchOptions<{ input: string; limit?: number }>
) {
	return fetch<{ input: string; output: string }>("post", "evaluate", options);
}
