import { NextResponse } from "next/server";

import { imageOrigins } from "./urls";
import {
	apiOrigin,
	environment,
	sentryDsn,
	uppyBucketOrigin,
	uppyCompanionUrl
} from "./const";
import { playlistPlatforms } from "./components/profile/playlist";

import type { NextRequest } from "next/server";

function getContentSecurityPolicy() {
	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

	const value = {
		"default-src": ["'self'"],
		"script-src": [
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
			"https://challenges.cloudflare.com"
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
			"https://cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.3/flags/4x3/"
		],
		"media-src": [
			"'self'",
			"blob:",
			"data:",
			...imageOrigins,
			// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
			"https://*.talkjs.com"
		],
		"connect-src": [
			"'self'",
			"blob:",
			apiOrigin,
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
			// https://docs.sentry.io/concepts/key-terms/dsn-explainer/
			new URL(sentryDsn).origin
		],
		"font-src": ["'self'"],
		"object-src": ["'self'", "data:"],
		"base-uri": ["'self'"],
		"form-action": ["'self'"],
		"frame-ancestors": ["'none'"],
		"frame-src": [
			apiOrigin,
			...playlistPlatforms.map(
				({ embed }) => new URL(embed("example", "light")).origin
			),
			// https://developers.cloudflare.com/turnstile/reference/content-security-policy/
			"https://challenges.cloudflare.com",
			// https://talkjs.com/docs/Features/Security_Settings/Content_Security_Policy/
			"https://*.talkjs.com",
			// https://developers.canny.io/
			"https://*.canny.io",
			// https://www.chargebee.com/docs/2.0/embedded-checkout.html
			"https://*.chargebee.com",
			// https://docs.widgetbot.io/
			"https://e.widgetbot.io"
		],
		"upgrade-insecure-requests": []
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

	if (searchParams.has("translating")) {
		// Support explicit translation opt-in via URL query parameter.
		// for example: https://flirtu.al/browse?translating
		request.headers.set("translating", "yes");
	}

	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
	const { nonce, value: contentSecurityPolicy } = getContentSecurityPolicy();
	request.headers.set("x-nonce", nonce);

	const response = NextResponse.next({
		request
	});

	response.headers.set("Content-Security-Policy", contentSecurityPolicy);
	return response;
}

export const config = {
	matcher:
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
};
