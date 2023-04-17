const yearInMilliseconds = 3.154e10;

export function yearsAgo(date: Date): number {
	return Math.floor((Date.now() - date.getTime()) / yearInMilliseconds);
}
