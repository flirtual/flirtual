interface Secrets {
	/** HMAC key for /image and /media URLs: `wrangler secret put SIGNING_KEY`. */
	SIGNING_KEY: string;
	/** Overrides src/allowed-hosts.json, comma- or space-separated, to match another TalkJS app. */
	ALLOWED_HOSTS?: string;
	/** The origin the app reaches this worker at, when it isn't the request's (`wrangler dev`). */
	PUBLIC_ORIGIN?: string;
}

interface Env extends Secrets {}

declare namespace Cloudflare {
	interface Env extends Secrets {}
}
