declare module "*?as=metadata" {
	// eslint-disable-next-line unicorn/prevent-abbreviations
	export const src: string;
	export const width: number;
	export const height: number;

	export default {
		src,
		width,
		height
	};
}

declare module "*&imagetools" {
	const source: string;
	export default source;
}
