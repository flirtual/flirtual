import { prerender } from "react-dom/static";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";

import { i18n } from "./i18n";
import { getLocale } from "./i18n/languages";

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext
) {
	const { pathname } = new URL(request.url);

	const locale = getLocale(pathname, pathname);
	if (locale) await i18n.changeLanguage(locale);
	await i18n.loadNamespaces(i18n.options.ns as Array<string> ?? ["data"]);

	const { prelude } = await prerender(
		<ServerRouter context={routerContext} url={request.url} />,
		{
			progressiveChunkSize: Number.POSITIVE_INFINITY,
			onError(error: unknown) {
				console.error(error);
				responseStatusCode = 500;
			}
		}
	);

	responseHeaders.set("Content-Type", "text/html");

	return new Response(prelude, {
		headers: responseHeaders,
		status: responseStatusCode
	});
}

export function handleError(
	error: unknown,
) {
	throw error;
}
