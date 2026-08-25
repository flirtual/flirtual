import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

const env: Env = {
	API_ORIGIN: "https://api.flirtual.com",
	DESTINATION_ORIGIN: "https://flirtual.com"
};

async function get(path: string, headers: Record<string, string> = {}) {
	const context = createExecutionContext();
	const response = await worker.fetch(
		new IncomingRequest(`https://flirtu.al${path}`, { headers }),
		env,
		context
	);

	await waitOnExecutionContext(context);
	return response;
}

function mockMint(implementation: (request: Request) => Response) {
	return vi.spyOn(globalThis, "fetch").mockImplementation(
		(input, init) => Promise.resolve(implementation(new Request(input as RequestInfo, init)))
	);
}

beforeEach(() => {
	vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("unexpected fetch"));
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("without a session", () => {
	it("redirects to the new domain, preserving path and query", async () => {
		const response = await get("/matches/abc?x=1");

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("https://flirtual.com/matches/abc?x=1");
	});

	it("preserves a profile slug, which outlives the migration", async () => {
		const response = await get("/zucc");
		expect(response.headers.get("location")).toBe("https://flirtual.com/zucc");
	});

	it("never calls the API", async () => {
		await get("/");
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it("keeps a protocol-relative path on the destination host", async () => {
		const response = await get("//evil.com/x");

		expect(new URL(response.headers.get("location")!).host).toBe("flirtual.com");
	});
});

describe("with a session", () => {
	it("hands off through the API's consume endpoint", async () => {
		mockMint(() => Response.json({ token: "tok" }, { status: 201 }));

		const response = await get("/matches/abc?x=1", { cookie: "session=abc" });
		const location = new URL(response.headers.get("location")!);

		expect(response.status).toBe(302);
		expect(location.origin).toBe("https://api.flirtual.com");
		expect(location.pathname).toBe("/v1/session/transfer/tok");
		expect(location.searchParams.get("next")).toBe("/matches/abc?x=1");
	});

	it("forwards only the session cookie when minting", async () => {
		let forwarded: null | string = null;
		mockMint((request) => {
			forwarded = request.headers.get("cookie");
			return Response.json({ token: "tok" }, { status: 201 });
		});

		await get("/", { cookie: "session=abc; other=keep-out" });
		expect(forwarded).toBe("session=abc");
	});

	it("forwards a real signed session cookie unchanged", async () => {
		const signed = "SFMyNTY.g3QAAAABbQAAAAV0b2tlbg.y_jUl-7oen43M1gRL-x3cfCMgXdZsTFe70yLd5IKaao";
		let forwarded: null | string = null;

		mockMint((request) => {
			forwarded = request.headers.get("cookie");
			return Response.json({ token: "tok" }, { status: 201 });
		});

		await get("/", { cookie: `session=${signed}` });
		expect(forwarded).toBe(`session=${signed}`);
	});

	it("keeps a value containing \"=\" intact", async () => {
		let forwarded: null | string = null;
		mockMint((request) => {
			forwarded = request.headers.get("cookie");
			return Response.json({ token: "tok" }, { status: 201 });
		});

		await get("/", { cookie: "session=padded==" });
		expect(forwarded).toBe("session=padded==");
	});

	it("marks the visitor as transferred so the next visit skips the API", async () => {
		mockMint(() => Response.json({ token: "tok" }, { status: 201 }));

		const response = await get("/", { cookie: "session=abc" });
		expect(response.headers.get("set-cookie")).toContain("transferred=1");
	});

	it("skips the handoff once already transferred", async () => {
		const response = await get("/", { cookie: "session=abc; transferred=1" });

		expect(response.headers.get("location")).toBe("https://flirtual.com/");
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it("still redirects when the session is rejected", async () => {
		mockMint(() => new Response(null, { status: 401 }));

		const response = await get("/matches", { cookie: "session=stale" });
		expect(response.headers.get("location")).toBe("https://flirtual.com/matches");
	});

	it("still redirects when the API is unreachable", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("down"));

		const response = await get("/matches", { cookie: "session=abc" });
		expect(response.headers.get("location")).toBe("https://flirtual.com/matches");
	});

	it("still redirects when the API returns no token", async () => {
		mockMint(() => Response.json({}, { status: 201 }));

		const response = await get("/", { cookie: "session=abc" });
		expect(response.headers.get("location")).toBe("https://flirtual.com/");
	});
});

describe("non-GET requests", () => {
	it("redirects without attempting a handoff", async () => {
		const context = createExecutionContext();
		const response = await worker.fetch(
			new IncomingRequest("https://flirtu.al/v1/thing", {
				method: "POST",
				headers: { cookie: "session=abc" }
			}),
			env,
			context
		);

		await waitOnExecutionContext(context);

		expect(response.status).toBe(307);
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});
});
