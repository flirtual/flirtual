import {
	sha as commitId,
	abbreviatedSha as commitIdShort,
	github as gitUrl
} from "~build/git";
import invariant from "tiny-invariant";

import type { DevicePlatform } from "./hooks/use-device";

export { default as builtAt } from "~build/time";

export const siteOrigin = import.meta.env.VITE_ORIGIN as string;
invariant(siteOrigin, "VITE_ORIGIN is required");

export const apiUrl = import.meta.env.VITE_API_URL as string;
invariant(apiUrl, "VITE_API_URL is required");

export const apiOrigin = new URL(apiUrl).origin;

export const preview = import.meta.env.VITE_PREVIEW as string || null;
export const development = import.meta.env.DEV;
export const production = !development;

// Captcha
export const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string;
export const talkjsAppId = import.meta.env.VITE_TALKJS_APP_ID as string;

// Sentry
export const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string;
export const sentryOrganization = import.meta.env.VITE_SENTRY_ORGANIZATION as string;
export const sentryProject = import.meta.env.SENTRY_PROJECT as string;
export const sentryProjectId = Number.parseInt(import.meta.env.VITE_SENTRY_PROJECT_ID as string || "0");
export const sentryReportTo = import.meta.env.VITE_SENTRY_REPORT_TO as string;

export const sentryEnabled = development
	&& !!sentryDsn
	&& !!sentryOrganization
	&& !!sentryProject
	&& !!sentryProjectId;

// PostHog
export const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string;
export const posthogHost = import.meta.env.VITE_POSTHOG_HOST as string;

export const posthogEnabled = !!posthogKey && !!posthogHost;

// Miscellaneous
export const cloudflareBeaconId = import.meta.env.VITE_CLOUDFLARE_BEACON_ID as string;

export const cannyAppId = import.meta.env.VITE_CANNY_APP_ID as string;
export const freshworksWidgetId = import.meta.env.VITE_FRESHWORKS_WIDGET_ID as string;

export const rcAppleKey = import.meta.env.VITE_RC_APPL_PUBLIC_KEY as string;
export const rcGoogleKey = import.meta.env.VITE_RC_GOOG_PUBLIC_KEY as string;
export const uppyCompanionUrl = import.meta.env.VITE_UPPY_COMPANION_URL as string;
export const uppyBucketOrigin = import.meta.env.VITE_UPPY_BUCKET_ORIGIN as string;
export const picoAppId = import.meta.env.VITE_PICO_APP_ID as string;

export const region = import.meta.env.VERCEL_REGION as string;

export const platformOverride = import.meta.env.VITE_PLATFORM_OVERRIDE as DevicePlatform | undefined;
export const nativeOverride = platformOverride ? platformOverride !== "web" : undefined;

export const maintenance = false;
export const server = import.meta.env.SSR;
export const client = !server;

export { commitId, commitIdShort };

export const commitUrl = `${gitUrl}/commit/${commitId}`;
