import ms from "ms";

const yearInMilliseconds = 3.154e10;

export function yearsAgo(date: Date): number {
	return Math.floor((Date.now() - date.getTime()) / yearInMilliseconds);
}

const fiveSecondsInMilliseconds = 5e3;

export function timeSince(date: Date, short: boolean = false): string {
	const since = Date.now() - date.getTime();
	return since < fiveSecondsInMilliseconds ? "just now" : ms(since, { long: !short });
}
