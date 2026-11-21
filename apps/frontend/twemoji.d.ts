declare module "virtual:twemoji" {
	/** URL of the Twemoji SVG for `codepoints`, as `@twemoji/parser` names them (e.g. `1f469-200d-1f4bb`). */
	export function twemojiUrl(codepoints: string): string;
}

declare module "@ffaubert/twemoji" {
	/** Absolute path to the directory of Twemoji SVGs, named `{codepoints}.svg`. */
	// eslint-disable-next-line unicorn/prevent-abbreviations
	export const svgDir: string;
}
