import type { CSSProperties } from "react";

function rgbComponentToHex(c: number) {
	const hex = c.toString(16);
	return hex.length === 1 ? `0${hex}` : hex;
}

export const rgb = {
	toHex: (r: number, g: number, b: number): string => {
		return `#${rgbComponentToHex(r)}${rgbComponentToHex(g)}${rgbComponentToHex(
			b
		)}`;
	},
	fromHex: (value: string) => {
		if (value.startsWith("#")) value = value.slice(1);

		return {
			r: Number.parseInt(value.slice(0, 2), 16),
			g: Number.parseInt(value.slice(2, 4), 16),
			b: Number.parseInt(value.slice(4, 6), 16)
		};
	}
};

function colorAverage(color1: string, color2: string) {
	const rgb1 = rgb.fromHex(color1);
	const rgb2 = rgb.fromHex(color2);

	return [
		Math.floor((rgb1.r + rgb2.r) / 2),
		Math.floor((rgb1.g + rgb2.g) / 2),
		Math.floor((rgb1.b + rgb2.b) / 2)
	] as const;
}

export function gradientTextColor(color1: string, color2: string) {
	const [r, g, b] = colorAverage(color1, color2);
	const threshold = 0.53;

	const decimals = [r / 255, g / 255, b / 255];
	const c = decimals.map((col) => {
		if (col <= 0.039_28) {
			return col / 12.92;
		}
		return ((col + 0.055) / 1.055) ** 2.4;
	});
	const L = 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
	return L > threshold ? "#111111" : "#F5F5F5";
}

// How far brand and profile colours move toward the edge of Display P3 on wide-colour screens.
export const wideGamutSaturation = 0.2;

// A colour in OKLCH with its chroma moved `amount` of the way to the edge of Display P3, for
// wide-colour screens. Returns null for anything but #rrggbb.
export function wideGamut(hex: string, amount = wideGamutSaturation): string | null {
	if (!/^#[\da-f]{6}$/i.test(hex)) return null;

	const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	const [r = 0, g = 0, b = 0] = [1, 3, 5].map((index) => toLinear(Number.parseInt(hex.slice(index, index + 2), 16) / 255));

	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
	const C = Math.hypot(A, B);
	const H = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;

	const inP3 = (chroma: number) => {
		const a = chroma * Math.cos((H * Math.PI) / 180);
		const b = chroma * Math.sin((H * Math.PI) / 180);
		const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
		const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
		const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
		const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
		const xyz = [[0.4123908, 0.3575843, 0.1804808], [0.212639, 0.7151687, 0.0721923], [0.0193308, 0.1191948, 0.9505322]].map((row) => row[0]! * rgb[0]! + row[1]! * rgb[1]! + row[2]! * rgb[2]!);
		return [[2.4934969, -0.9313836, -0.4027108], [-0.829489, 1.7626641, 0.0236247], [0.0358458, -0.0761724, 0.9568845]]
			.map((row) => row[0]! * xyz[0]! + row[1]! * xyz[1]! + row[2]! * xyz[2]!)
			.every((channel) => channel >= -1e-4 && channel <= 1 + 1e-4);
	};

	let low = 0;
	let high = 0.5;
	for (let index = 0; index < 40; index++) {
		const middle = (low + high) / 2;
		if (inP3(middle)) low = middle;
		else high = middle;
	}

	const chroma = C + (Math.max(C, low * 0.97) - C) * amount;
	return `oklch(${(L * 100).toFixed(1)}% ${chroma.toFixed(3)} ${H.toFixed(1)})`;
}

// Profile colours as the custom properties [data-profile-colors] reads; index.css picks the wide-gamut
// pair on screens that can show it.
export function profileColors(color1: string, color2: string): CSSProperties {
	return {
		"--profile-color-1": color1,
		"--profile-color-2": color2,
		"--profile-wide-color-1": wideGamut(color1) ?? color1,
		"--profile-wide-color-2": wideGamut(color2) ?? color2,
		"--theme-text": gradientTextColor(color1, color2)
	} as CSSProperties;
}

let hexCanvas: CanvasRenderingContext2D | null | undefined;

// A CSS custom property's colour as #rrggbb, the only format the native plugins parse. Wide-gamut
// colours are drawn into an sRGB canvas, which maps them to the nearest sRGB colour.
export function cssVariableHex(name: string, element: Element = document.body): string {
	const value = getComputedStyle(element).getPropertyValue(name).trim();
	if (/^#[\da-f]{6}$/i.test(value)) return value;

	hexCanvas ??= Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { colorSpace: "srgb", willReadFrequently: true });
	if (!hexCanvas) return value;

	hexCanvas.clearRect(0, 0, 1, 1);
	hexCanvas.fillStyle = value;
	hexCanvas.fillRect(0, 0, 1, 1);
	const [r = 0, g = 0, b = 0] = hexCanvas.getImageData(0, 0, 1, 1).data;
	return rgb.toHex(r, g, b);
}
