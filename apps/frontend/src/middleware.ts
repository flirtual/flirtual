import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { playlistPlatforms } from "./components/profile/playlist";
import {
	apiOrigin,
	environment,
	posthogEnabled,
	posthogHost,
	sentryDsn,
	sentryEnabled,
	sentryReportTo,
	siteOrigin,
	uppyBucketOrigin,
	uppyCompanionUrl
} from "./const";
import { imageOrigins } from "./urls";

function getContentSecurityPolicy() {
	const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(8))).toString("base64url");
	const reportTo = sentryEnabled ? sentryReportTo : undefined;

	const value = {
		"default-src": ["'self'"],
		"script-src": [
			siteOrigin,
			environment === "development"
				? ["'self'", "'unsafe-eval'", "'unsafe-inline'"]
				: ["'strict-dynamic'", `'nonce-${nonce}'`],
			// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
			"https://*.talkjs.com",
			// https://developers.canny.io/
			"https://canny.io",
			// https://developers.freshdesk.com/widget-api/
			"https://*.freshworks.com",
			"https://*.freshdesk.com",
			// https://developers.cloudflare.com/turnstile/reference/content-security-policy/
			"https://challenges.cloudflare.com",
			// https://developers.cloudflare.com/web-analytics/
			"https://static.cloudflareinsights.com",
			// https://posthog.com/docs
			"https://us-assets.i.posthog.com"
		],
		"style-src": [
			"'self'",
			// `'nonce-${nonce}'`,
			// TODO: Work towards removing this directive.
			"'unsafe-inline'",
			// https://developers.freshdesk.com/widget-api/
			"https://*.freshworks.com",
			"https://*.freshdesk.com"
		],
		"img-src": [
			"'self'",
			"blob:",
			"data:",
			...imageOrigins,
			// Country flag icons.
			"https://cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.3/flags/4x3/",
			// ???
			"https://play-lh.googleusercontent.com"
		],
		"media-src": [
			"'self'",
			"blob:",
			"data:",
			...imageOrigins,
			// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
			"https://*.talkjs.com",
			// https://vrcdn.live/
			"https://stream.vrcdn.live"
		],
		"connect-src": [
			"'self'",
			"blob:",
			apiOrigin,
			...imageOrigins,
			uppyCompanionUrl,
			uppyBucketOrigin,
			// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
			"https://*.talkjs.com",
			"wss://*.talkjs.com",
			"https://capture.trackjs.com",
			// https://developers.canny.io/
			"https://api.canny.io",
			// https://developers.freshdesk.com/widget-api/
			"https://*.freshworks.com",
			"https://*.freshdesk.com",
			// https://github.com/passkeydeveloper/passkey-authenticator-aaguids
			"https://raw.githubusercontent.com/passkeydeveloper/passkey-authenticator-aaguids/main/combined_aaguid.json",
			// https://developers.cloudflare.com/web-analytics/
			"https://cloudflareinsights.com",
			"https://static.cloudflareinsights.com",
			// https://docs.sentry.io/concepts/key-terms/dsn-explainer/
			sentryEnabled && new URL(sentryDsn).origin,
			// https://posthog.com/docs
			posthogEnabled && posthogHost,
		],
		"font-src": ["'self'"],
		"object-src": ["'self'", "data:"],
		"base-uri": ["'self'"],
		"form-action": ["'self'"],
		"frame-ancestors": ["'none'"],
		"frame-src": [
			apiOrigin,
			...playlistPlatforms.map(
				({ embed }) => new URL(embed("example", "light", "en")).origin
			),
			// https://developers.cloudflare.com/turnstile/reference/content-security-policy/
			"https://challenges.cloudflare.com",
			// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
			"https://*.talkjs.com",
			// https://developers.canny.io/
			"https://canny.io",
			"https://*.canny.io",
			// https://www.chargebee.com/docs/2.0/embedded-checkout.html
			"https://chargebee.com",
			"https://*.chargebee.com",
			// https://docs.widgetbot.io/
			"https://e.widgetbot.io"
		],
		"upgrade-insecure-requests": [],
		...(reportTo
			? {
				"report-uri": [reportTo],
				"report-to": ["csp"]
			}
			: {
			})
	};

	return {
		nonce,
		value: Object.entries(value)
			.map(
				([directive, sources]) =>
					`${directive} ${sources.flat().filter(Boolean).join(" ")}`
			)
			.join("; ")
	};
}

export function middleware(request: NextRequest) {
	const { searchParams } = request.nextUrl;

	request.headers.set("url", request.url);

	if (searchParams.get("language")) {
		// Support explicit language override via URL query parameter.
		// for example: https://flirtu.al/home?language=ja
		request.headers.set("language", searchParams.get("language")!);
	}

	if (searchParams.get("theme")) {
		// Support explicit theme override via URL query parameter.
		// for example: https://flirtu.al/browse?theme=dark
		request.headers.set("theme", searchParams.get("theme")!);
	}

	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
	const { nonce, value: contentSecurityPolicy } = getContentSecurityPolicy();
	request.headers.set("x-nonce", nonce);

	const response = NextResponse.next({
		request
	});

	response.headers.set("content-security-policy", contentSecurityPolicy);
	return response;
}

export const config = {
	matcher:
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
};
