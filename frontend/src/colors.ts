function rgbComponentToHex(c: number) {
	const hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

export const rgb = {
	toHex: (r: number, g: number, b: number): string => {
		return `#${rgbComponentToHex(r)}${rgbComponentToHex(g)}${rgbComponentToHex(b)}`;
	}
};
