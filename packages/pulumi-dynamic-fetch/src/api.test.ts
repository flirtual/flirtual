import { afterEach, describe, expect, it, vi } from "vitest";

import { Api, FetchError } from "./api.ts";

function respond(status: number, body?: unknown) {
	return new Response(body === undefined ? null : JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});
}

function stubFetch(response: Response) {
	const fetch = vi.fn(async (_url: URL, _init: RequestInit) => response);
	vi.stubGlobal("fetch", fetch);
	return fetch;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("Api", () => {
	it("joins the path onto the base URL and sends the configured headers", async () => {
		const fetch = stubFetch(respond(200, { id: "a" }));
		const api = new Api({
			baseUrl: "https://example.com/api/v2",
			headers: { authorization: "Bearer token" },
			encoding: "json",
		});

		await api.request("GET", "/things/a");

		const [url, init] = fetch.mock.calls[0]!;
		expect(url.href).toBe("https://example.com/api/v2/things/a");
		expect(init.method).toBe("GET");
		expect(new Headers(init.headers).get("authorization")).toBe("Bearer token");
	});

	it("sends a JSON body with a JSON content type", async () => {
		const fetch = stubFetch(respond(200, {}));
		const api = new Api({ baseUrl: "https://example.com", headers: {}, encoding: "json" });

		await api.request("POST", "/things", { name: "a", tags: ["x", "y"] });

		const [, init] = fetch.mock.calls[0]!;
		expect(new Headers(init.headers).get("content-type")).toBe("application/json");
		expect(init.body).toBe('{"name":"a","tags":["x","y"]}');
	});

	it("form-encodes a body, indexing arrays and nesting objects", async () => {
		const fetch = stubFetch(respond(200, {}));
		const api = new Api({ baseUrl: "https://example.com", headers: {}, encoding: "form" });

		await api.request("POST", "/things", {
			name: "a b",
			enabled_events: ["one", "two"],
			meta: { key: "value" },
			disabled: false,
			skipped: undefined,
		});

		const [, init] = fetch.mock.calls[0]!;
		expect(new Headers(init.headers).get("content-type")).toBe("application/x-www-form-urlencoded");
		expect(init.body).toBe(
			"name=a+b&enabled_events%5B0%5D=one&enabled_events%5B1%5D=two&meta%5Bkey%5D=value&disabled=false",
		);
	});

	it("sends no body or content type when there is no body", async () => {
		const fetch = stubFetch(respond(200, {}));
		const api = new Api({ baseUrl: "https://example.com", headers: {}, encoding: "form" });

		await api.request("POST", "/things/a/delete");

		const [, init] = fetch.mock.calls[0]!;
		expect(init.body).toBeUndefined();
		expect(new Headers(init.headers).has("content-type")).toBe(false);
	});

	it("returns the parsed JSON response", async () => {
		stubFetch(respond(201, { webhook_endpoint: { id: "we_1" } }));
		const api = new Api({ baseUrl: "https://example.com", headers: {}, encoding: "json" });

		expect(await api.request("POST", "/things", {})).toEqual({ webhook_endpoint: { id: "we_1" } });
	});

	it("returns undefined for an empty success response", async () => {
		stubFetch(respond(204));
		const api = new Api({ baseUrl: "https://example.com", headers: {}, encoding: "json" });

		expect(await api.request("DELETE", "/things/a")).toBeUndefined();
	});

	it("returns undefined for a 404, so a missing resource reads as gone", async () => {
		stubFetch(respond(404, { message: "not found" }));
		const api = new Api({ baseUrl: "https://example.com", headers: {}, encoding: "json" });

		expect(await api.request("GET", "/things/missing")).toBeUndefined();
	});

	it("throws a FetchError with the status and body for any other failure", async () => {
		stubFetch(respond(422, { message: "url is invalid" }));
		const api = new Api({ baseUrl: "https://example.com", headers: {}, encoding: "json" });

		const error = await api.request("POST", "/things", {}).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(FetchError);
		expect(error).toMatchObject({
			status: 422,
			method: "POST",
			url: "https://example.com/things",
			body: '{"message":"url is invalid"}',
		});
	});
});
