export type Encoding = "json" | "form";

export interface Connection {
	baseUrl: string;
	headers: Record<string, string>;
	encoding: Encoding;
}

export type Body = Record<string, unknown>;

export class FetchError extends Error {
	readonly method: string;
	readonly url: string;
	readonly status: number;
	readonly body: string;

	constructor(method: string, url: string, status: number, body: string) {
		super(`${method} ${url} failed with ${status}: ${body}`);
		this.name = "FetchError";
		this.method = method;
		this.url = url;
		this.status = status;
		this.body = body;
	}
}

// Nested values use the bracket convention (`events[0]`, `meta[key]`) that form-encoded APIs such
// as Chargebee's read.
function fields(value: unknown, key: string): Array<[string, string]> {
	if (value === undefined || value === null) return [];
	if (Array.isArray(value)) return value.flatMap((item, index) => fields(item, `${key}[${index}]`));
	if (typeof value === "object")
		return Object.entries(value).flatMap(([name, item]) => fields(item, `${key}[${name}]`));

	return [[key, String(value)]];
}

export function formEncode(body: Body) {
	return new URLSearchParams(
		Object.entries(body).flatMap(([key, value]) => fields(value, key)),
	).toString();
}

const encoders: Record<Encoding, { contentType: string; encode: (body: Body) => string }> = {
	json: { contentType: "application/json", encode: (body) => JSON.stringify(body) },
	form: { contentType: "application/x-www-form-urlencoded", encode: formEncode },
};

export class Api {
	readonly connection: Connection;

	constructor(connection: Connection) {
		this.connection = connection;
	}

	// A 404 resolves to undefined, so a resource deleted outside Pulumi reads as gone.
	async request<T = unknown>(method: string, path: string, body?: Body): Promise<T | undefined> {
		const { baseUrl, headers, encoding } = this.connection;
		const encoder = encoders[encoding];
		const url = new URL(`${baseUrl.replace(/\/$/u, "")}${path}`);

		const response = await fetch(url, {
			method,
			headers: body === undefined ? headers : { ...headers, "content-type": encoder.contentType },
			body: body === undefined ? undefined : encoder.encode(body),
		});

		if (response.status === 404) return undefined;

		const text = await response.text();
		if (!response.ok) throw new FetchError(method, url.href, response.status, text);

		return text ? (JSON.parse(text) as T) : undefined;
	}
}
