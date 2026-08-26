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
	0x11136, // Chakma
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

// Returns a Date whose UTC fields hold the wall-clock time in `timezone`, so it can be
// formatted or shifted without relying on the device's own timezone.
export function wallClockInTimezone(date: Date, timezone?: string): Date {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			hourCycle: "h23",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit"
		})
			.formatToParts(date)
			.map(({ type, value }) => [type, value])
	);

	return new Date(Date.UTC(
		Number(parts.year),
		Number(parts.month) - 1,
		Number(parts.day),
		Number(parts.hour) % 24,
		Number(parts.minute),
		Number(parts.second)
	));
}
