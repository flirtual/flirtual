import { afterEach, describe, expect, it, vi } from "vitest";

import { request } from "./client.ts";
import { api, ok, respond, stubListmonk } from "./fetch.fixtures.ts";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("request", () => {
	it("returns the payload inside Listmonk's `data` wrapper", async () => {
		stubListmonk({ "GET /lists/1": [ok({ id: 1, name: "Newsletter" })] });

		expect(await request(api, "GET", "/lists/1")).toEqual({ id: 1, name: "Newsletter" });
	});

	it("returns undefined for a 404", async () => {
		stubListmonk({ "GET /lists/9": [respond(404, { message: "not found" })] });

		expect(await request(api, "GET", "/lists/9")).toBeUndefined();
	});
});
