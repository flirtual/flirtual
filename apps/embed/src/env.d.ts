interface Secrets {
	/** HMAC key for /image and /media URLs: `wrangler secret put SIGNING_KEY`. */
	SIGNING_KEY: string;
	/** Overrides apps/api/priv/chat/allowed-hosts.json, comma- or space-separated, to match another TalkJS app. */
	ALLOWED_HOSTS?: string;
	/** Overrides apps/api/priv/chat/allowed-matches.json, as a JSON array of regexp literals. */
	ALLOWED_MATCHES?: string;
	/** The origin the app reaches this worker at, when it isn't the request's (`wrangler dev`). */
	PUBLIC_ORIGIN?: string;
}

interface Env extends Secrets {}

declare namespace Cloudflare {
	interface Env extends Secrets {}
}
