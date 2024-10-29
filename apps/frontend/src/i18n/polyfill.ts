import { shouldPolyfill } from "@formatjs/intl-displaynames/should-polyfill";

interface PolyfillOptions {
	force?: boolean;
}

export async function polyfill(
	locale: string,
	{ force = false }: PolyfillOptions = {}
) {
	if (!shouldPolyfill(locale) && !force) return;

	await import("@formatjs/intl-displaynames/polyfill-force");
	await import(`@formatjs/intl-displaynames/locale-data/${locale}`);
}
