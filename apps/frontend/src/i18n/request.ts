import { captureException } from "@sentry/nextjs";
import deepmerge from "deepmerge";
import type {
	AbstractIntlMessages,
	NamespaceKeys,
	NestedKeyOf
} from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { cache } from "react";

import type { PreferenceLanguage } from "~/api/user/preferences";

import { getInternationalization } from ".";

export type MessageKeys = NamespaceKeys<
	IntlMessages,
	NestedKeyOf<IntlMessages>
>;

async function getLanguageMessages(locale: PreferenceLanguage) {
	const { default: messages } = await import(
		`../../messages/${locale}.json`
	).catch(() => ({}));

	const attributes = (
		await import(`../../messages/attributes.${locale}.json`).catch(() => ({
			default: {}
		}))
	).default as Record<string, Record<string, unknown>>;

	// @uppy/locales/en_US
	const uppy = (await import(`@uppy/locales/lib/${{
		en: "en_US",
		// de: "de_DE",
		// es: "es_ES",
		// fr: "fr_FR",
		ja: "ja_JP"// ,
		// ko: "ko_KR",
		// nl: "nl_NL",
		// pt: "pt_PT",
		// "pt-BR": "pt_BR",
		// ru: "ru_RU",
		// sv: "sv_SE"
	}[locale]}.js`)).default.strings;

	return {
		...messages,
		uppy,
		attributes: Object.values(attributes).reduce((previous, current) => {
			return { ...previous, ...current };
		}, {})
	};
}

const getMessages = cache(async (): Promise<AbstractIntlMessages> => {
	const { locale } = await getInternationalization();

	const fallback = await getLanguageMessages(locale.fallback);

	const current
		= locale.current === locale.fallback
			? fallback
			: await getLanguageMessages(locale.current);

	const preferred
		= locale.current === locale.preferred
			? current
			: await getLanguageMessages(locale.preferred);

	const messages = deepmerge(fallback, current) as any;

	return {
		...messages,
		pleasant_ugliest_expert_camera: preferred.pleasant_ugliest_expert_camera
	};
});

export default getRequestConfig(async () => {
	const { locale } = await getInternationalization();
	const messages = await getMessages();

	return {
		locale: locale.current,
		messages,
		onError: captureException
	};
});
