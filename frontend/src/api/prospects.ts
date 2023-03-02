import { fetch, FetchOptions } from ".";

export async function list(options: FetchOptions = {}): Promise<Array<string>> {
	return fetch<Array<string>>("get", "prospects", options);
}
