/* eslint-disable unicorn/numeric-separators-style */

export const siteOrigin = process.env.NEXT_PUBLIC_ORIGIN as string;
export const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;

export const environment = (process.env.NEXT_PUBLIC_VERCEL_ENV ||
	process.env.NODE_ENV) as string;

export const uploadcarePublicKey = process.env
	.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY as string;
export const hcaptchaSiteKey = process.env
	.NEXT_PUBLIC_HCAPTCHA_SITE_KEY as string;
export const talkjsAppId = process.env.NEXT_PUBLIC_TALKJS_APP_ID as string;
export const freshworksWidgetId = 73000002566;
export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN as string;
