// see: https://developers.cloudflare.com/workers/static-assets/headers/

import { playlistPlatforms } from "~/components/profile/playlist";
import {
	apiOrigin,
	commitId,
	development,
	embedOrigin,
	klipyAppKey,
	posthogHost,
	preview,
	sentryDsn,
	sentryReportTo
} from "~/const";
import { bucketOrigins } from "~/urls";

const embedHost = embedOrigin && new URL(embedOrigin).host;

type Sources = Array<false | string | null | undefined>;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
 */
const contentSecurityPolicy: Record<string, Sources> = {
	"default-src": ["'self'"],
	"script-src": [
		"'self'",
		"'unsafe-inline'",
		// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
		"cdn.jsdelivr.net",
		// https://developers.freshdesk.com/widget-api/
		"*.freshworks.com",
		"*.freshdesk.com",
		// https://developers.google.com/recaptcha/docs/faq (Freshworks captcha)
		"www.google.com/recaptcha/",
		"www.gstatic.com/recaptcha/",
		// https://developers.cloudflare.com/turnstile/reference/content-security-policy/
		"challenges.cloudflare.com",
		// https://developers.cloudflare.com/web-analytics/
		"static.cloudflareinsights.com",
		// https://posthog.com/docs/advanced/content-security-policy
		posthogHost && new URL(posthogHost).host,
		"*.posthog.com",
		// https://www.chargebee.com/docs/billing/2.0/hosted-capabilities/embedded-checkout
		"*.chargebee.com"
	],
	"style-src": [
		"'self'",
		"'unsafe-inline'",
		// https://developers.freshdesk.com/widget-api/
		"*.freshworks.com",
		"*.freshdesk.com",
		// https://www.chargebee.com/docs/billing/2.0/hosted-capabilities/embedded-checkout
		"*.chargebee.com",
		// https://posthog.com/docs/advanced/content-security-policy
		"*.posthog.com"
	],
	"img-src": [
		"'self'",
		"blob:",
		"data:",
		...bucketOrigins.map((origin) => new URL(origin).host),
		// https://www.chargebee.com/docs/billing/2.0/hosted-capabilities/embedded-checkout
		"*.chargebee.com",
		"cb-invoice-logos-prod.s3.us-east-1.amazonaws.com",
		// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
		"firebasestorage.googleapis.com",
		"*.tjstatic.net",
		"maps.googleapis.com",
		// https://posthog.com/docs/advanced/content-security-policy
		"*.posthog.com",
		// Chat embeds' images, proxied: apps/embed.
		embedHost,
		// https://docs.klipy.com/network-requirements
		klipyAppKey && "*.klipy.com",
	],
	"media-src": [
		"'self'",
		"blob:",
		"data:",
		...bucketOrigins.map((origin) => new URL(origin).host),
		// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
		"*.talkjs.com",
		"firebasestorage.googleapis.com",
		"tjstatic.net",
		// https://vrcdn.live/
		"stream.vrcdn.live",
		// Chat embeds' videos, proxied: apps/embed.
		embedHost,
		// https://posthog.com/docs/advanced/content-security-policy
		"*.posthog.com",
	],
	"connect-src": [
		"'self'",
		"blob:",
		new URL(apiOrigin).host,
		...bucketOrigins.map((origin) => new URL(origin).host),
		// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
		"*.talkjs.com",
		"wss://*.talkjs.com",
		"cdn.jsdelivr.net",
		"capture.trackjs.com",
		// https://developers.freshdesk.com/widget-api/
		"*.freshworks.com",
		"*.freshdesk.com",
		// https://developers.google.com/recaptcha/docs/faq (Freshworks captcha)
		"www.google.com/recaptcha/",
		// https://github.com/passkeydeveloper/passkey-authenticator-aaguids
		"raw.githubusercontent.com/passkeydeveloper/",
		// https://developers.cloudflare.com/web-analytics/
		"cloudflareinsights.com",
		"static.cloudflareinsights.com",
		// https://docs.sentry.io/concepts/key-terms/dsn-explainer/
		sentryDsn && new URL(sentryDsn).host,
		// https://posthog.com/docs/advanced/content-security-policy
		posthogHost && new URL(posthogHost).host,
		"*.posthog.com",
		// https://www.chargebee.com/docs/billing/2.0/hosted-capabilities/embedded-checkout
		"*.chargebee.com",
		// Chat embeds: apps/embed.
		embedHost,
		// https://docs.klipy.com/network-requirements
		klipyAppKey && "api.klipy.com"
	],
	"font-src": [
		"'self'",
		// https://posthog.com/docs/advanced/content-security-policy
		"*.posthog.com",
	],
	"object-src": ["'self'", "data:"],
	"base-uri": ["'self'"],
	"form-action": ["'self'"],
	"frame-ancestors": [
		"'self'",
		// https://posthog.com/docs/advanced/content-security-policy
		"*.posthog.com",
	],
	"frame-src": [
		new URL(apiOrigin).host,
		// https://developers.cloudflare.com/turnstile/reference/content-security-policy/
		"challenges.cloudflare.com",
		// https://developers.google.com/recaptcha/docs/faq (Freshworks captcha)
		"www.google.com/recaptcha/",
		"recaptcha.google.com/recaptcha/",
		// https://www.chargebee.com/docs/billing/2.0/hosted-capabilities/embedded-checkout
		"chargebee.com",
		"*.chargebee.com",
		// https://docs.widgetbot.io/
		"e.widgetbot.io",
		// Music platforms.
		...playlistPlatforms.map(({ embed }) => new URL(embed("example", "light", "en")).host),
		// Chat embeds. Never a third party directly: apps/embed's frames hold each
		// player to the TalkJS link allowlist with their own frame-src.
		embedHost,
	],
	// https://docs.sentry.io/platforms/javascript/session-replay/#content-security-policy-csp
	// https://posthog.com/docs/advanced/content-security-policy
	"worker-src": [
		"'self'",
		"blob:",
		"data:",
		// https://posthog.com/docs/advanced/content-security-policy
		"*.posthog.com",
	],
	"upgrade-insecure-requests": []
};

const cspReporting: Record<string, Sources> = sentryReportTo
	? { "report-uri": [sentryReportTo], "report-to": ["csp"] }
	: {};

function serializePolicy(directives: Record<string, Sources>) {
	return Object.entries(directives)
		.map(([directive, sources]) => `${directive} ${[...new Set(sources.filter(Boolean))].sort().join(" ")}`)
		.join("; ");
}

const data = [
	{
		url: "/*",
		headers: [
			{
				key: "x-dns-prefetch-control",
				value: "on"
			},
			{
				key: "strict-transport-security",
				value: "max-age=63072000; includeSubDomains; preload"
			},
			{
				key: "x-content-type-options",
				value: "nosniff"
			},
			{
				key: "referrer-policy",
				value: "strict-origin-when-cross-origin"
			},
			/**
			 * @see https://http.dev/document-policy
			 * @see https://docs.sentry.io/platforms/javascript/guides/react/profiling/browser-profiling/
			 */
			{
				key: "document-policy",
				value: "js-profiling"
			},
			/**
			 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy
			 */
			{
				key: "permissions-policy",
				value: Object.entries({
					// Chat embeds' players: apps/embed delegates these to the frames it hosts.
					autoplay: ["self", embedOrigin && `"${embedOrigin}"`],
					fullscreen: ["self", embedOrigin && `"${embedOrigin}"`],
					"idle-detection": ["self"],
					"picture-in-picture": ["self", embedOrigin && `"${embedOrigin}"`],
					"encrypted-media": ["self", embedOrigin && `"${embedOrigin}"`],
					"publickey-credentials-create": ["self"],
					"publickey-credentials-get": ["self"],
					"web-share": ["self"],
					camera: [],
					microphone: [],
					geolocation: ["self"],
					"browsing-topics": [],
					...(development
						? {}
						: {
								"local-network": [],
								"loopback-network": [],
								"local-network-access": []
							})
				})
					.map(([key, value]) => `${key}=(${value.filter(Boolean).join(" ")})`)
					.join(", ")
			},
			// Cloudflare caps each _headers line at 2,000 characters, so connect-src is a second policy
			// on its own line. Browsers enforce every policy, so the first lets through any connection the
			// second might allow.
			{
				key: "content-security-policy",
				value: serializePolicy({ ...contentSecurityPolicy, "connect-src": ["'self'", "blob:", "https:", "wss:"], ...cspReporting })
			},
			{
				key: "content-security-policy",
				value: serializePolicy({ "connect-src": contentSecurityPolicy["connect-src"], ...cspReporting })
			},
			/**
			 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Robots-Tag
			 */
			{
				key: "x-robots-tag",
				value: (development || preview
					? [
							"noindex",
							"nofollow",
							"nosnippet",
						]
					: ["all"]).join(", "),
			},
			{
				key: "x-flirtual-version",
				value: commitId
			},
			{
				key: "x-flirtual-environment",
				value: preview
					? "preview"
					: development
						? "development"
						: "production"
			},
			preview && {
				key: "x-flirtual-preview",
				value: preview
			}
		],
	},
	{
		url: "/static/*",
		headers: [
			{
				key: "cache-control",
				value: "public, max-age=31536000, immutable"
			},
			!(development || preview) && {
				key: "x-robots-tag",
				value: [
					"noindex",
					"nofollow",
					"nosnippet",
				].join(", ")
			}
		]
	}
]
	.map(({ url, headers }) =>
		`${url}\n${headers
			.filter(Boolean)
			.map(({ key, value }) => `  ${key}: ${value}`)
			.join("\n")}`
	)
	.join("\n\n");

// https://developers.cloudflare.com/workers/static-assets/headers/: "Each line in the `_headers`
// file has a 2,000 character limit." Cloudflare rejects the deploy otherwise, so fail the build.
const maximumLineLength = 2000;

export function loader() {
	for (const line of data.split("\n")) {
		if (line.length > maximumLineLength)
			throw new Error(`_headers line is ${line.length} characters, over Cloudflare's ${maximumLineLength}: ${line.slice(0, 60)}…`);
	}

	return data;
}
