import i18n from "i18next";
import type { ResourceKey } from "i18next";
import icu from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";
import { useCallback } from "react";
import { initReactI18next, useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";

import { log as _log } from "../log";
import {
	defaultLocale,
	localeNames,
	localePathnameRegex,
	locales,
	replaceLanguage
} from "./languages";
import type { Locale } from "./languages";

const log = _log.extend("i18n");

export {
	defaultLocale,
	localeNames,
	localePathnameRegex,
	locales,
	replaceLanguage
};
export type { Locale };

export const defaultNamespace = "default";
export type DefaultNamespace = typeof defaultNamespace;

export type Resources = Awaited<ReturnType<typeof load>>;
export type Namespace = keyof Resources;

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: DefaultNamespace;
		resources: Resources;
	}
}

export function guessLocale() {
	const [, maybeLocale] = location.pathname.split("/");

	return maybeLocale && locales.includes(maybeLocale)
		? maybeLocale as Locale
		: defaultLocale;
}

function flat1<T extends Record<string, Record<string, ResourceKey>>>(value: T) {
	return Object.values(value).reduce((previous, current) => {
		return { ...previous, ...current };
	}, {});
}

async function load(locale: Locale) {
	console.log("load(%s)", locale);
	log("load(%s)", locale);

	// Aries: Keep this in sync with `getModuleLanguage` from `vite.config.ts`.
	// For performance, we bundle all translations into a single file per locale.
	const [default_, attributes, uppy] = await Promise.all([
		import(`../messages/${locale}.json`) as unknown as typeof import("../../messages/en.json"),
		import(`../messages/attributes.${locale}.json`)
			.then(({ default: attributes }) => flat1(attributes)),
		(async () => {
			// https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
			switch (locale) {
				case "en": return (await import("@uppy/locales/lib/en_US.js")).default.strings;
				case "ja": return (await import("@uppy/locales/lib/ja_JP.js")).default.strings;
				default: return {};
			}
		})()
	]);

	const resources ={
		default: default_,
		attributes,
		uppy
	};

	console.log("i18n resources loaded for %s: %O", locale, resources);
	return resources;
}

i18n
	.use(resourcesToBackend(load))
	.use(icu)
	.use(initReactI18next)
	.init({
		supportedLngs: locales,

		ns: [defaultNamespace],
		defaultNS: defaultNamespace,

		interpolation: {
			escapeValue: false
		}
	});

export function useLocale(): [locale: Locale, setLocale: (locale: Locale) => Promise<void>] {
	const { i18n } = useTranslation();

	const location = useLocation();
	const navigate = useNavigate();

	const setLocale = useCallback(async (locale: Locale) => {
		await navigate(replaceLanguage(location, locale), { replace: true });
	}, [location, navigate]);

	return [
		i18n.language as Locale,
		setLocale
	];
}

export function useMessages<T extends Namespace = "default">(namespace: T = "default" as T): Resources[T] {
	const { i18n } = useTranslation();
	const [locale] = useLocale();

	return i18n.store.data[locale][namespace] as Resources[T];
}

export { i18n };
