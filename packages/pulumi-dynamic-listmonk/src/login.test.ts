import { afterEach, expect, it, vi } from "vitest";

import { login } from "./login.ts";

const connection = {
	baseUrl: "https://listmonk.example/api",
	headers: {},
	encoding: "json" as const,
};

function stubLogin(response: Response) {
	const sent: Array<Request> = [];
	vi.stubGlobal("fetch", async (input: URL, init: RequestInit) => {
		sent.push(new Request(input, init));
		return response;
	});
	return sent;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

it("signs in through the admin login form and keeps only the session cookie", async () => {
	const sent = stubLogin(
		new Response(null, {
			status: 302,
			headers: [
				["location", "/admin"],
				["set-cookie", "nonce=n0nce; Path=/; HttpOnly; SameSite=Lax"],
				["set-cookie", "session=s3ss10n; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax"],
			],
		}),
	);

	const headers = await login(connection, { username: "admin", password: "hunter22" });

	expect(headers).toEqual({ cookie: "session=s3ss10n" });
	expect(sent).toHaveLength(1);
	expect(sent[0]!.method).toBe("POST");
	expect(sent[0]!.url).toBe("https://listmonk.example/admin/login");
	expect(sent[0]!.redirect).toBe("manual");
	expect(sent[0]!.headers.get("content-type")).toBe("application/x-www-form-urlencoded");
	expect(await sent[0]!.text()).toBe("username=admin&password=hunter22");
});

it("sends the connection's headers, so the login passes a proxy such as Cloudflare Access", async () => {
	const sent = stubLogin(
		new Response(null, {
			status: 302,
			headers: [["set-cookie", "session=s3ss10n; Path=/; HttpOnly"]],
		}),
	);

	await login(
		{
			...connection,
			headers: { "cf-access-client-id": "id.access", "cf-access-client-secret": "secret" },
		},
		{ username: "admin", password: "hunter22" },
	);

	expect(sent[0]!.headers.get("cf-access-client-id")).toBe("id.access");
	expect(sent[0]!.headers.get("cf-access-client-secret")).toBe("secret");
	expect(sent[0]!.headers.get("content-type")).toBe("application/x-www-form-urlencoded");
});

it("fails when Listmonk answers without a session, as it does for a wrong password", async () => {
	stubLogin(
		new Response("<html>login page</html>", {
			status: 200,
			headers: [["set-cookie", "nonce=n0nce; Path=/; HttpOnly; SameSite=Lax"]],
		}),
	);

	await expect(login(connection, { username: "admin", password: "wrong" })).rejects.toThrow(
		"Listmonk refused the login for admin (200).",
	);
});
