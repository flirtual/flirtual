import signal from "signal-tus-server/src/index.ts";

export { AttachmentUploadHandler } from "signal-tus-server/src/index.ts";

// The frontend origin allowed to upload here; unset where uploads stay same-origin.
type Environment = Parameters<typeof signal.fetch>[1] & { ALLOWED_ORIGIN?: string };

// Signal's server takes attachments at /upload/attachments. /tus is the same collection on the
// uploads host, which the frontend reaches cross-origin, so it also answers CORS.
const tusPath = "/tus";
const signalPath = "/upload/attachments";

// https://tus.io/protocols/resumable-upload#headers
const allowedHeaders = [
	"Authorization",
	"Content-Type",
	"Tus-Resumable",
	"Upload-Length",
	"Upload-Defer-Length",
	"Upload-Offset",
	"Upload-Metadata",
	"X-HTTP-Method-Override",
];
const exposedHeaders = [
	"Location",
	"Tus-Resumable",
	"Tus-Version",
	"Tus-Extension",
	"Tus-Max-Size",
	"Upload-Offset",
	"Upload-Length",
	"Upload-Metadata",
	"Upload-Expires",
];

// Maps a /tus path onto Signal's, and back.
function rebase(pathname: string, from: string, to: string) {
	const rest = pathname.slice(from.length).replace(/^\/$/u, "");
	return `${to}${rest}`;
}

const isUnder = (pathname: string, path: string) =>
	pathname === path || pathname.startsWith(`${path}/`);

function withCors(response: Response, request: Request, env: Environment) {
	const headers = new Headers(response.headers);
	headers.append("Vary", "Origin");

	if (request.headers.get("Origin") === env.ALLOWED_ORIGIN) {
		headers.set("Access-Control-Allow-Origin", env.ALLOWED_ORIGIN);
		headers.set("Access-Control-Expose-Headers", exposedHeaders.join(", "));
	}

	return new Response(response.body, { status: response.status, headers });
}

export default {
	async fetch(request, env, context) {
		const url = new URL(request.url);
		if (!isUnder(url.pathname, tusPath)) return signal.fetch(request, env, context);

		url.pathname = rebase(url.pathname, tusPath, signalPath);

		// Signal answers OPTIONS only on the collection; a preflight can come for any upload under it.
		if (request.method === "OPTIONS") {
			const capabilities = await signal.fetch(
				new Request(new URL(signalPath, url), { method: "OPTIONS" }),
				env,
				context,
			);

			const response = withCors(capabilities, request, env);
			response.headers.set("Access-Control-Allow-Methods", "POST, PATCH, HEAD, OPTIONS");
			response.headers.set("Access-Control-Allow-Headers", allowedHeaders.join(", "));
			response.headers.set("Access-Control-Max-Age", "86400");
			return response;
		}

		const response = withCors(
			await signal.fetch(new Request(url, request), env, context),
			request,
			env,
		);

		const location = response.headers.get("Location");
		if (location) {
			const target = new URL(location, url);
			if (isUnder(target.pathname, signalPath)) {
				target.pathname = rebase(target.pathname, signalPath, tusPath);
				response.headers.set("Location", target.href);
			}
		}

		return response;
	},
} satisfies ExportedHandler<Environment>;
