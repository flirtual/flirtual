/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-restricted-imports */
import deepmerge from "deepmerge";
import i18n from "i18next";
import type { BackendModule, ResourceKey } from "i18next";
import icu from "i18next-icu";
import { useCallback } from "react";
import { initReactI18next, useTranslation } from "react-i18next";
import {
	Navigate as _Navigate,
	redirect as _redirect,
	useNavigate as _useNavigate,
	createPath,
	useLocation
} from "react-router";
import type { NavigateOptions as _NavigateOptions, NavigateProps, RedirectFunction, To } from "react-router";

import { server } from "~/const";

import { log as _log } from "../log";
import {
	defaultLocale,
	getLocale,
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

const defaultNamespace = "data";
export type DefaultNamespace = typeof defaultNamespace;

type Resources = Awaited<ReturnType<typeof load>>;
type Namespace = keyof Resources;

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: DefaultNamespace;
		resources: Resources;
	}
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
		import(`../../messages/${locale}.json`)
			.then(({ default: messages }) => messages) as unknown as typeof import("../../messages/en.json"),
		import(`../../messages/attributes.${locale}.json`)
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

	return {
		[defaultNamespace]: {
			...default_,
			attributes,
			uppy
		},
	};
}

i18n
	.use({
		type: "backend",
		init: () => {},
		read: async (locale: Locale, namespace, callback) => {
			if (!locales.includes(locale)) throw new Error(`Unknown locale: ${locale}`);

			const [defaultResource, resource] = await Promise.all([
				load(defaultLocale),
				locale !== defaultLocale
					? load(locale)
					: {}
			]);

			const data = deepmerge(defaultResource, resource);
			callback(null, (data && (data as any)[namespace]) || data);
		}
	} satisfies BackendModule)
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
		log("setLocale(%s)", locale);

		await i18n.loadLanguages(locale);
		await navigate(replaceLanguage(location, locale));
	}, [i18n, location, navigate]);

	return [
		i18n.language as Locale,
		setLocale,
	];
}

export function useMessages<T extends Namespace = DefaultNamespace>(namespace: T = defaultNamespace as T): Resources[T] {
	const { i18n } = useTranslation();
	const [locale] = useLocale();

	return i18n.store.data[locale][namespace] as Resources[T];
}

type NavigateOptions = _NavigateOptions & { locale?: Locale };

interface NavigateFunction {
	(to: To, options?: NavigateOptions): Promise<void> | void;
	(delta: number): Promise<void> | void;
}

export function useNavigate() {
	const navigate = _useNavigate();

	return useCallback<NavigateFunction>((toOrDelta: To | number, { locale, ...options }: NavigateOptions = {}) => {
		if (typeof toOrDelta === "number") return navigate(toOrDelta);

		const toLocale = getLocale(toOrDelta);
		if (toLocale) locale = toLocale;

		return navigate(replaceLanguage(toOrDelta, locale || defaultLocale), options);
	}, [navigate]);
}

export const redirect: RedirectFunction = (url, init) => {
	return _redirect(createPath(replaceLanguage(url, getLocale(url) || defaultLocale)), init);
};

export function Navigate({ to, ...props }: NavigateProps) {
	const [locale] = useLocale();

	return (
		<_Navigate
			{...props}
			to={replaceLanguage(to, locale)}
		/>
	);
}

// function excludeLocale(to: To = window.location.pathname) {
// 	return;
// 	history.replaceState(history.state, "", createPath(replaceLanguage(to, null)));
// }

export { i18n };

if (!server) {
	const pushState = history.pushState;
	history.pushState = function (data, unused, url) {
		pushState.call(history, data, unused, url);

		// Hide the locale from the URL, if any.
		// if (url) history.replaceState(data, unused, createPath(replaceLanguage(url.toString(), null)));
	};
}
