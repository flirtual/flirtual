export function yearsAgo(date: Date): number {
	const today = new Date();
	const currentYear = today.getUTCFullYear();
	const dateThisYear = new Date(
		currentYear,
		date.getUTCMonth(),
		date.getUTCDate()
	);
	let diff = currentYear - date.getUTCFullYear();
	if (today.getTime() < dateThisYear.getTime()) diff--;
	return diff;
}

export function endOfYear(date: Date = new Date()): Date {
	return new Date(date.getFullYear(), 11, 31);
}
