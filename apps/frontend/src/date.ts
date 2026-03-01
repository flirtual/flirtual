export function yearsAgo(date: Date): number {
	const now = new Date();
	const currentYear = now.getUTCFullYear();
	const currentMonth = now.getUTCMonth();
	const birthMonth = date.getUTCMonth();

	let diff = currentYear - date.getUTCFullYear();
	if (currentMonth < birthMonth
		|| (currentMonth === birthMonth
			&& now.getUTCDate() < date.getUTCDate()))
		diff--;

	return diff;
}

export function endOfYear(date: Date = new Date()): Date {
	return new Date(date.getFullYear(), 11, 31);
}

export function toLocalDateString(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
