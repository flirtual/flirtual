/* eslint-disable unicorn/numeric-separators-style */

export const siteOrigin = process.env.NEXT_PUBLIC_ORIGIN as string;
export const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;

export const environment = (process.env.NEXT_PUBLIC_VERCEL_ENV ||
	process.env.NODE_ENV) as string;

export const gitOrganization = process.env
	.NEXT_PUBLIC_VERCEL_GIT_REPO_OWNER as string;
export const gitRepository = process.env
	.NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG as string;
export const gitCommitSha = process.env
	.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA as string;
export const gitCommitReference = process.env
	.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF as string;
export const gitCommitUrl = gitCommitSha
	? `https://github.com/${gitOrganization}/${gitRepository}/commit/${gitCommitSha}`
	: null;

export const uploadcarePublicKey = process.env
	.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY as string;
export const hcaptchaSiteKey = process.env
	.NEXT_PUBLIC_HCAPTCHA_SITE_KEY as string;
export const talkjsAppId = process.env.NEXT_PUBLIC_TALKJS_APP_ID as string;
export const freshworksWidgetId = 73000002566;
export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN as string;
export const rcAppleKey = process.env.NEXT_PUBLIC_RC_APPL_PUBLIC_KEY as string;
export const rcGoogleKey = process.env.NEXT_PUBLIC_RC_GOOG_PUBLIC_KEY as string;
