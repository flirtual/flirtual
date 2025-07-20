import i18n from "i18next";
import type { ResourceKey } from "i18next";
import icu from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";
import { useCallback } from "react";
import { initReactI18next, useTranslation } from "react-i18next";
import { resolvePath, useLocation, useNavigate } from "react-router";
import type { Path, To } from "react-router";

import { log as _log } from "./log";

const log = _log.extend("i18n");

export const locales = ["en", "ja"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale = "en";
export type DefaultLocale = typeof defaultLocale;

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

// eslint-disable-next-line regexp/no-optional-assertion
export const localePathnameRegex = new RegExp(`^\/(${locales.join("|")})?(\/|$)?`);

export const localeNames: Record<Locale, string> = {
	en: "English",
	// de: "Deutsch",
	// es: "Español",
	// fr: "Français",
	ja: "日本語"// ,
	// ko: "한국어",
	// nl: "Nederlands",
	// pt: "Português",
	// "pt-BR": "Português (Brasil)",
	// ru: "Русский",
	// sv: "Svenska"
};

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
	log("load(%s)", locale);

	// Aries: Keep this in sync with `getModuleLanguage` from `vite.config.ts`.
	// For performance, we bundle all translations into a single file per locale.
	const [default_, attributes, uppy] = await Promise.all([
		import(`../messages/${locale}.json`) as unknown as typeof import("../messages/en.json"),
		import(`../messages/attributes.${locale}.json`)
			.then(({ default: attributes }) => flat1(attributes)),
		(async () => {
			// https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
			switch (locale) {
				case "en": return (await import("@uppy/locales/lib/en_US.js")).default.strings;
				case "ja": return (await import("@uppy/locales/lib/ja_JP.js")).default.strings;
				default: return {};
			}
		})(),
	]);

	return {
		default: default_,
		attributes,
		uppy
	};
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

export function replaceLanguage(to: To, locale: Locale, relativeTo: string = window.location.pathname): Path {
	let { pathname, ...path } = resolvePath(to, relativeTo);
	pathname = pathname.replace(localePathnameRegex, locale === defaultLocale ? "/" : `/${locale}/`);

	return { ...path, pathname };
}

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
