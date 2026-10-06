import type { Connection, Credentials } from "@flirtual/pulumi-dynamic-fetch";

// The API takes an admin's session cookie as it takes an API user's token, and an install can set
// the admin's password but not an API token: it always generates one (listmonk cmd/install.go).
export async function login({ baseUrl, headers }: Connection, { username, password }: Credentials) {
	const response = await fetch(new URL("/admin/login", baseUrl), {
		method: "POST",
		headers: { ...headers, "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({ username: username!, password: password! }),
		redirect: "manual",
	});

	// A Set-Cookie value starts with its name=value pair, up to the first ";" (RFC 6265 §4.1.1).
	const session = response.headers
		.getSetCookie()
		.map((cookie) => cookie.split(";", 1)[0]!.trim())
		.find((pair) => pair.startsWith("session="));

	if (!session) throw new Error(`Listmonk refused the login for ${username} (${response.status}).`);
	return { cookie: session };
}
