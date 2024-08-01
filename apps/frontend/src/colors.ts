function rgbComponentToHex(c: number) {
	const hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
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

const colorAverage = (color1: string, color2: string) => {
	const rgb1 = rgb.fromHex(color1);
	const rgb2 = rgb.fromHex(color2);

	return [
		Math.floor((rgb1.r + rgb2.r) / 2),
		Math.floor((rgb1.g + rgb2.g) / 2),
		Math.floor((rgb1.b + rgb2.b) / 2)
	] as const;
};

export function gradientTextColor(color1: string, color2: string) {
	const [r, g, b] = colorAverage(color1, color2);
	const threshold = 0.53;

	const decimals = [r / 255, g / 255, b / 255];
	const c = decimals.map((col) => {
		if (col <= 0.039_28) {
			return col / 12.92;
		}
		return Math.pow((col + 0.055) / 1.055, 2.4);
	});
	const L = 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
	return L > threshold ? "#111111" : "#F5F5F5";
}
