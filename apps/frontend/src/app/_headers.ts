// see: https://developers.cloudflare.com/workers/static-assets/headers/

import { playlistPlatforms } from "~/components/profile/playlist";
import {
	apiOrigin,
	bucketUploadsSignedOrigin,
	commitId,
	development,
	preview,
	sentryDsn,
	sentryEnabled,
	sentryReportTo
} from "~/const";
import { polyfillBaseUrl } from "~/polyfill";
import { bucketOrigins } from "~/urls";

const contentSecurityPolicyReportTo = sentryEnabled
	? sentryReportTo
	: undefined;

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
			 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy
			 */
			{
				key: "permissions-policy",
				value: Object.entries({
					autoplay: ["self"],
					fullscreen: ["self"],
					"idle-detection": ["self"],
					"picture-in-picture": ["self"],
					"publickey-credentials-create": ["self"],
					"publickey-credentials-get": ["self"],
					"web-share": ["self"],
					camera: [],
					microphone: [],
					geolocation: ["self"],
					"browsing-topics": []
				})
					.map(([key, value]) => `${key}=(${value.join(" ")})`)
					.join(", ")
			},
			/**
			 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
			 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
			 * @see https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
			 */
			{
				key: "content-security-policy",
				value: Object.entries({
					"default-src": ["'self'"],
					"script-src": [
						"'self'",
						"'unsafe-inline'",
						polyfillBaseUrl.href.replace(polyfillBaseUrl.origin, polyfillBaseUrl.host),
						// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
						"*.talkjs.com",
						// https://developers.canny.io/
						"canny.io",
						// https://developers.freshdesk.com/widget-api/
						"*.freshworks.com",
						"*.freshdesk.com",
						// https://developers.cloudflare.com/turnstile/reference/content-security-policy/
						"challenges.cloudflare.com",
						// https://developers.cloudflare.com/web-analytics/
						"static.cloudflareinsights.com"
					],
					"style-src": [
						"'self'",
						"'unsafe-inline'",
						// https://developers.freshdesk.com/widget-api/
						"*.freshworks.com",
						"*.freshdesk.com"
					],
					"img-src": [
						"'self'",
						"blob:",
						"data:",
						...bucketOrigins.map((origin) => new URL(origin).host)
					],
					"media-src": [
						"'self'",
						"blob:",
						"data:",
						...bucketOrigins.map((origin) => new URL(origin).host),
						// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
						"*.talkjs.com",
						// https://vrcdn.live/
						"stream.vrcdn.live"
					],
					"connect-src": [
						"'self'",
						"blob:",
						new URL(apiOrigin).host,
						...bucketOrigins.map((origin) => new URL(origin).host),
						new URL(bucketUploadsSignedOrigin).host,
						// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
						"*.talkjs.com",
						"wss://*.talkjs.com",
						"capture.trackjs.com",
						// https://developers.canny.io/
						"api.canny.io",
						// https://developers.freshdesk.com/widget-api/
						"*.freshworks.com",
						"*.freshdesk.com",
						// https://github.com/passkeydeveloper/passkey-authenticator-aaguids
						"raw.githubusercontent.com/passkeydeveloper/passkey-authenticator-aaguids/main/combined_aaguid.json",
						// https://developers.cloudflare.com/web-analytics/
						"cloudflareinsights.com",
						"static.cloudflareinsights.com",
						// https://docs.sentry.io/concepts/key-terms/dsn-explainer/
						sentryEnabled && new URL(sentryDsn).host,
					],
					"font-src": ["'self'"],
					"object-src": ["'self'", "data:"],
					"base-uri": ["'self'"],
					"form-action": ["'self'"],
					"frame-ancestors": ["'none'"],
					"frame-src": [
						new URL(apiOrigin).host,
						// https://developers.cloudflare.com/turnstile/reference/content-security-policy/
						"challenges.cloudflare.com",
						// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
						"*.talkjs.com",
						// https://developers.canny.io/
						"canny.io",
						"*.canny.io",
						// https://www.chargebee.com/docs/2.0/embedded-checkout.html
						"chargebee.com",
						"*.chargebee.com",
						// https://docs.widgetbot.io/
						"e.widgetbot.io",
						// Music platforms.
						...playlistPlatforms.map(({ embed }) => new URL(embed("example", "light", "en")).host),
					],
					"upgrade-insecure-requests": [],
					...(contentSecurityPolicyReportTo
						? {
								"report-uri": [contentSecurityPolicyReportTo],
								"report-to": ["csp"]
							}
						: {})
				})
					.map(([directive, sources]) => `${directive} ${[...new Set(
						sources
							.flat()
							.filter(Boolean)
					)]
						.sort()
						.join(" ")}`)
					.join("; ")
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

export function loader() {
	return data;
}
