/* eslint-disable react-refresh/only-export-components, no-restricted-imports */
import deepmerge from "deepmerge";
import i18n from "i18next";
import type { BackendModule, ResourceKey } from "i18next";
import icu from "i18next-icu";
import { useCallback, useSyncExternalStore } from "react";
import { initReactI18next, useTranslation } from "react-i18next";
import {
	Navigate as _Navigate,
	redirect as _redirect,
	useMatch as _useMatch,
	useNavigate as _useNavigate,
	createPath,
	useLocation
} from "react-router";
import type {
	NavigateOptions as _NavigateOptions,
	NavigateProps,
	To
} from "react-router";

import { server } from "~/const";
import { polyfillForLanguage } from "~/polyfill";
import { isInternalHref } from "~/urls";

import { log as _log } from "../log";
import {
	allLocales,
	defaultLocale,
	getLocale,
	intlLocale,
	localeNames,
	localePathnameRegex,
	locales,
	replaceLanguage
} from "./languages";
import type { AnyLocale, Locale } from "./languages";

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

async function load(locale: AnyLocale) {
	// Aries: Keep this in sync with `getManualChunk` from `vite.config.ts`.
	// For performance, we bundle all translations into a single file per locale.
	const [default_, attributes, uppy] = await Promise.all([
		import(`../../messages/${locale}.json`)
			.then(({ default: messages }) => messages) as unknown as typeof import("../../messages/en.json"),
		import(`../../messages/attributes.${locale}.json`)
			.then(({ default: attributes }) => flat1(attributes)),
		(async () => {
			// https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
			// Widened to string so cases for locales not yet enabled in `languages.ts` still type-check.
			switch (locale as string) {
				case "en": return (await import("@uppy/locales/lib/en_US.js")).default.strings;
				case "de": return (await import("@uppy/locales/lib/de_DE.js")).default.strings;
				case "es": return (await import("@uppy/locales/lib/es_ES.js")).default.strings;
				case "fr": return (await import("@uppy/locales/lib/fr_FR.js")).default.strings;
				case "ja": return (await import("@uppy/locales/lib/ja_JP.js")).default.strings;
				case "ko": return (await import("@uppy/locales/lib/ko_KR.js")).default.strings;
				case "nl": return (await import("@uppy/locales/lib/nl_NL.js")).default.strings;
				case "pt": return (await import("@uppy/locales/lib/pt_PT.js")).default.strings;
				case "pt-BR": return (await import("@uppy/locales/lib/pt_BR.js")).default.strings;
				case "ru": return (await import("@uppy/locales/lib/ru_RU.js")).default.strings;
				case "sv": return (await import("@uppy/locales/lib/sv_SE.js")).default.strings;
				default: return {};
			}
		})(),
		polyfillForLanguage(locale),
	]);

	return {
		[defaultNamespace]: {
			...default_,
			attributes,
			uppy
		},
	};
}

// Per-device, from /debugger: any locale's text (enabled or not), or every string as its key.
export type TranslationPreview = "keys" | AnyLocale;

const previewStorageKey = "translation_preview";
const previewListeners = new Set<() => void>();

function isPreview(value: string | null): value is TranslationPreview {
	return value === "keys" || allLocales.includes(value as AnyLocale);
}

let preview: TranslationPreview | null = (() => {
	try {
		const value = localStorage.getItem(previewStorageKey);
		return isPreview(value) ? value : null;
	}
	catch {
		return null;
	}
})();

// Keeps objects whole so `returnObjects` callers don't break.
function withKeys(value: unknown, path: string): unknown {
	if (typeof value === "string") return path;
	if (Array.isArray(value)) return value.map((item, index) => withKeys(item, `${path}.${index}`));
	if (value && typeof value === "object") {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, withKeys(item, `${path}.${key}`)]));
	}
	return value;
}

export async function setTranslationPreview(next: TranslationPreview | null) {
	try {
		if (next) localStorage.setItem(previewStorageKey, next);
		else localStorage.removeItem(previewStorageKey);
	}
	catch {}

	preview = next;
	previewListeners.forEach((listener) => listener());

	await i18n.reloadResources();
	// Re-renders every useTranslation consumer.
	await i18n.changeLanguage(i18n.language);
}

export function useTranslationPreview() {
	return useSyncExternalStore(
		(listener) => {
			previewListeners.add(listener);
			return () => previewListeners.delete(listener);
		},
		() => preview,
		() => null
	);
}

// For Intl names (countries, languages): the previewed locale, if any.
export function useDisplayLocale(): AnyLocale {
	const [locale] = useLocale();
	const preview = useTranslationPreview();
	return preview && preview !== "keys" ? preview : locale;
}

i18n
	.use({
		type: "backend",
		init: () => {},
		read: async (locale: Locale, namespace, callback) => {
			if (!locales.includes(locale)) throw new Error(`Unknown locale: ${locale}`);

			const source = preview && preview !== "keys" ? preview : locale;
			const [defaultResource, resource] = await Promise.all([
				load(defaultLocale),
				source !== defaultLocale
					? load(source)
					: {}
			]);

			const data = deepmerge(defaultResource, resource);
			callback(null, (data && (data as any)[namespace]) || data);
		}
	} satisfies BackendModule)
	.use({
		type: "postProcessor",
		name: "translationPreview",
		process: (value: unknown, key: Array<string> | string) => {
			const [first] = [key].flat();
			return preview === "keys" && first ? withKeys(value, first) : value;
		}
	})
	.use(icu)
	.use(initReactI18next)
	.init({
		supportedLngs: locales,
		fallbackLng: defaultLocale,
		postProcess: ["translationPreview"],

		ns: [defaultNamespace],
		defaultNS: defaultNamespace,

		i18nFormat: {
			parseLngForICU: intlLocale
		},

		interpolation: {
			escapeValue: false
		},
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

		if (!isInternalHref(toOrDelta) && typeof toOrDelta === "string") {
			window.location.href = toOrDelta;
			return;
		}

		locale ??= getLocale(toOrDelta) || defaultLocale;
		return navigate(replaceLanguage(toOrDelta, locale), options);
	}, [navigate]);
}

export function redirect(url: string, { locale, ...init }: { locale?: Locale } & RequestInit = {}) {
	locale ??= getLocale(url) || defaultLocale;
	return _redirect(createPath(replaceLanguage(url, locale)), init);
}

export function Navigate({ to, ...props }: NavigateProps) {
	const [locale] = useLocale();

	return (
		<_Navigate
			{...props}
			to={replaceLanguage(to, locale)}
		/>
	);
}

export function useMatch(pattern: Parameters<typeof _useMatch>[0]) {
	const [locale] = useLocale();
	const { pathname } = useLocation();

	const { path, ...options } = typeof pattern === "string" ? { path: pattern } : pattern;

	return _useMatch({
		path: replaceLanguage(path, locale, pathname).pathname,
		...options
	});
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
