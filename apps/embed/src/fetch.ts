export type Fetcher = (request: Request) => Promise<Response>;

export class FetchError extends Error {
	override name = "FetchError";
}

const maximumRedirects = 8;

// Workers can't reach private networks, but a hostname that is an address (or a name that only
// means something internally) is never a page we want, so refuse them before asking.
export function fetchable(url: URL): boolean {
	if (url.protocol !== "https:" && url.protocol !== "http:") return false;
	if (url.username || url.password || url.port) return false;

	const host = url.hostname.toLowerCase().replace(/\.$/, "");
	if (!host.includes(".") || host.startsWith("[") || /^[\d.]+$/.test(host)) return false;

	return !/\.(?:localhost|local|internal|lan|home|arpa|test|invalid|example)$/.test(host);
}

export interface FollowOptions {
	fetcher: Fetcher;
	headers?: HeadersInit;
	timeout?: number;
	cf?: RequestInitCfProperties;
	/** Stops before fetching a URL, and returns it with no response. */
	stopAt?: (url: URL) => boolean;
}

export interface Followed {
	url: URL;
	response: Response;
}

// Follows redirects one hop at a time, so every hop is checked and the caller learns where the
// chain ended, rather than only the first URL it asked for.
export async function follow(start: URL, options: FollowOptions & { stopAt: (url: URL) => boolean }): Promise<Followed | { url: URL; response: null }>;
export async function follow(start: URL, options: FollowOptions): Promise<Followed>;
export async function follow(start: URL, { fetcher, headers, timeout = 8000, cf, stopAt }: FollowOptions): Promise<Followed | { url: URL; response: null }> {
	const signal = AbortSignal.timeout(timeout);
	let url = start;

	for (let hop = 0; hop <= maximumRedirects; hop++) {
		if (stopAt?.(url)) return { url, response: null };
		if (!fetchable(url)) throw new FetchError(`Refusing to fetch ${url.href}`);

		const response = await fetcher(new Request(url, { headers, redirect: "manual", signal, cf }));
		const location = response.headers.get("location");

		if (response.status < 300 || response.status >= 400 || !location) return { url, response };

		await response.body?.cancel();
		url = new URL(location, url);
		url.hash = "";
	}

	throw new FetchError(`Too many redirects from ${start.href}`);
}

// Ends the stream after `bytes`, either quietly (a page whose <head> is all we read) or as an
// error (an image too large to pass along whole).
export function limit(body: ReadableStream<Uint8Array>, bytes: number, mode: "truncate" | "error"): ReadableStream<Uint8Array> {
	const reader = body.getReader();
	let seen = 0;

	return new ReadableStream({
		async pull(controller) {
			const { done, value } = await reader.read();
			if (done) return controller.close();

			seen += value.byteLength;
			if (seen <= bytes) return controller.enqueue(value);

			await reader.cancel();
			if (mode === "error") return controller.error(new FetchError(`Body is over ${bytes} bytes`));

			controller.enqueue(value.subarray(0, value.byteLength - (seen - bytes)));
			controller.close();
		},
		cancel: (reason) => reader.cancel(reason)
	});
}

// Reads the first `bytes` of a stream, and returns them along with a stream that still starts at
// the beginning.
export async function peek(body: ReadableStream<Uint8Array>, bytes: number): Promise<[Uint8Array, ReadableStream<Uint8Array>]> {
	const reader = body.getReader();
	const chunks: Array<Uint8Array> = [];
	let length = 0;

	while (length < bytes) {
		const { done, value } = await reader.read();
		if (done) break;

		chunks.push(value);
		length += value.byteLength;
	}

	const head = new Uint8Array(length);
	let offset = 0;
	for (const chunk of chunks) {
		head.set(chunk, offset);
		offset += chunk.byteLength;
	}

	const rest = new ReadableStream<Uint8Array>({
		start(controller) {
			if (head.byteLength > 0) controller.enqueue(head);
		},
		async pull(controller) {
			const { done, value } = await reader.read();
			if (done) controller.close();
			else controller.enqueue(value);
		},
		cancel: (reason) => reader.cancel(reason)
	});

	return [head, rest];
}

export async function readJson(response: Response, bytes: number): Promise<unknown> {
	if (!response.body) return null;

	const text = await new Response(limit(response.body, bytes, "error")).text();
	return JSON.parse(text) as unknown;
}

export function contentType(response: Response): string {
	return response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
}
