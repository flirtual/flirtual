import { PassThrough } from "node:stream";

import { createReadableStreamFromReadable } from "@react-router/node";
import { renderToPipeableStream } from "react-dom/server";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";

import { i18n } from "./i18n";
import { getLocale } from "./i18n/languages";

export const streamTimeout = 1000;

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext
) {
	const { pathname } = new URL(request.url);

	const locale = getLocale(pathname, pathname);
	if (locale) await i18n.changeLanguage(locale);

	return new Promise((resolve, reject) => {
		const { pipe, abort } = renderToPipeableStream(
			<ServerRouter context={routerContext} url={request.url} />,
			{
				onAllReady() {
					const body = new PassThrough();
					const stream = createReadableStreamFromReadable(body);

					responseHeaders.set("Content-Type", "text/html");

					resolve(
						new Response(stream, {
							headers: responseHeaders,
							status: responseStatusCode,
						})
					);

					pipe(body);
				},
				onShellError(error: unknown) {
					console.error("onShellError", error);
					reject(error);
				},
				onError(error: unknown) {
					console.error("onError", error);
					responseStatusCode = 500;
				},
			}
		);

		// Abort the rendering stream after the `streamTimeout` so it has time to
		// flush down the rejected boundaries
		setTimeout(abort, streamTimeout);
	});
}

export function handleError(
	error: unknown,
) {
	throw error;
}
