// Redirects the old domain to the new one, carrying the visitor's session with
// them. A session cookie is scoped to the domain that set it, so the API mints
// a single-use token for us and consumes on arrival.

const sessionCookie = "session";
const transferredCookie = "transferred";

// Long-lived: we only need to transfer a user once.
const transferredCookieMaxAge = 31_536_000;

function readCookie(header: null | string, name: string) {
	for (const pair of header?.split(";") ?? []) {
		const separator = pair.indexOf("=");
		if (separator === -1) continue;

		// Cookie values may contain "=", so split on the first one only.
		if (pair.slice(0, separator).trim() === name)
			return pair.slice(separator + 1).trim() || null;
	}

	return null;
}

async function createTransferToken(env: Env, session: string) {
	try {
		const response = await fetch(new URL("/v1/session/transfer", env.API_ORIGIN), {
			method: "POST",
			headers: { cookie: `${sessionCookie}=${session}` }
		});

		if (!response.ok) return null;

		const { token } = await response.json() as { token?: string };
		return token || null;
	}
	catch {
		// An unreachable API must not strand the user.
		return null;
	}
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = `${url.pathname}${url.search}`;

		const destination = new URL(env.DESTINATION_ORIGIN);
		destination.pathname = url.pathname;
		destination.search = url.search;

		// Only a navigation can complete the redirect chain, and only a GET is
		// safe to replay through it.
		if (request.method !== "GET") return Response.redirect(destination.href, 307);

		const cookie = request.headers.get("cookie");
		const session = readCookie(cookie, sessionCookie);

		if (!session || readCookie(cookie, transferredCookie))
			return Response.redirect(destination.href, 302);

		const token = await createTransferToken(env, session);
		if (!token) return Response.redirect(destination.href, 302);

		const consume = new URL(
			`/v1/session/transfer/${encodeURIComponent(token)}`,
			env.API_ORIGIN
		);
		consume.searchParams.set("next", path);

		return new Response(null, {
			status: 302,
			headers: {
				location: consume.href,
				"set-cookie":
					`${transferredCookie}=1; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${transferredCookieMaxAge}`
			}
		});
	}
} satisfies ExportedHandler<Env>;
