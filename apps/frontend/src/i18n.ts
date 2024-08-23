import { IntlErrorCode } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { create as setupAcceptLanguage } from "accept-language";
import { headers } from "next/headers";

import { withOptionalSession } from "./server-utilities";

export default getRequestConfig(async () => {
	const { languageTags, sourceLanguageTag } = await import(
		"../project.inlang/settings.json"
	);

	const al = setupAcceptLanguage();
	al.languages(languageTags);

	const session = await withOptionalSession();
	const locale =
		session?.user?.language ||
		al.get(headers().get("accept-language")) ||
		sourceLanguageTag;

	const { default: source } = await import(
		`../messages/${sourceLanguageTag}.json`
	);
	const { default: messages } =
		locale === sourceLanguageTag
			? { default: source }
			: await import(`../messages/${locale}.json`);

	return {
		locale,
		messages,
		getMessageFallback({ error, namespace, key }) {
			if (error.code !== IntlErrorCode.MISSING_MESSAGE) throw error;

			const path = [namespace, key].filter((part) => part != null).join(".");
			return source[path];
		}
	};
});
