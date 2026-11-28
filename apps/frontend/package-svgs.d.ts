declare module "virtual:twemoji" {
	/** URL of the Twemoji SVG for `codepoints`, as `@twemoji/parser` names them (e.g. `1f469-200d-1f4bb`). */
	export function twemojiUrl(codepoints: string): string;
}

declare module "virtual:flag-icons" {
	/** URL of the 4:3 flag for an ISO 3166-1 alpha-2 `countryId` (e.g. `us`), or `undefined` if flag-icons has none. */
	export function flagUrl(countryId: string): string | undefined;
}

declare module "@ffaubert/twemoji" {
	/** Absolute path to the directory of Twemoji SVGs, named `{codepoints}.svg`. */
	// eslint-disable-next-line unicorn/prevent-abbreviations
	export const svgDir: string;
}
