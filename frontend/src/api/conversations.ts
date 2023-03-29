import { fetch, NarrowFetchOptions } from "./exports";

export async function list(options: NarrowFetchOptions = {}): Promise<Array<unknown>> {
	return fetch<Array<unknown>>("get", "conversations", options);
}
