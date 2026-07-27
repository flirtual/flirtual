const digitZeros = [
	0x0660, // Arabic-Indic
	0x06F0, // Extended Arabic-Indic (Persian)
	0x07C0, // NKo
	0x0966, // Devanagari
	0x09E6, // Bengali
	0x0E50, // Thai
	0x0ED0, // Lao
	0x0F20, // Tibetan
	0x1040, // Myanmar
	0x17E0, // Khmer
	0x1C50, // Ol Chiki
	0x1E950 // Adlam
];

export function toAsciiDigits(value: string): string {
	return value.replace(/\p{Nd}/gu, (digit) => {
		const code = digit.codePointAt(0)!;
		const zero = digitZeros.find((zero) => code >= zero && code <= zero + 9);

		return zero === undefined ? digit : String(code - zero);
	});
}

export function endOfYear(date: Date = new Date()): Date {
	return new Date(date.getFullYear(), 11, 31);
}

export function toLocalDateString(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
