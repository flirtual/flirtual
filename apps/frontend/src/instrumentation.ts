import { captureRequestError, init } from "@sentry/nextjs";

import { sentryConfig } from "./sentry";

export const onRequestError = captureRequestError;

export function register() {
	init(sentryConfig);
}
