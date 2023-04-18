import ms from "ms";

const yearInMilliseconds = 3.154e10;

export function yearsAgo(date: Date): number {
	return Math.floor((Date.now() - date.getTime()) / yearInMilliseconds);
}

export function timeSince(date: Date): string {
	return ms(date.getTime() / 1000, { long: true });
}
