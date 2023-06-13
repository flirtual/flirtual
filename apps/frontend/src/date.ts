const secondInMilliseconds = 1e3;
const minuteInMilliseconds = 6e4;
const hourInMilliseconds = 3.6e6;
const dayInMilliseconds = 8.64e7;
const monthInMilliseconds = 2.628e9;
const yearInMilliseconds = 3.154e10;

export function yearsAgo(date: Date): number {
	return Math.floor((Date.now() - date.getTime()) / yearInMilliseconds);
}

export interface RelativeTimeOptions {
	approximate?: boolean;
	suffix?: string;
}

export function relativeTime(
	date: Date,
	options: RelativeTimeOptions = {}
): string {
	const { approximate = true, suffix = "ago" } = options;
	const since = Date.now() - date.getTime();

	if (approximate && since < secondInMilliseconds * 5) return "just now";

	if (since < minuteInMilliseconds) {
		const seconds = Math.floor(since / secondInMilliseconds);
		return seconds === 1
			? `a second ${suffix}`
			: `${seconds} seconds ${suffix}`;
	}

	if (since < hourInMilliseconds) {
		const minutes = Math.floor(since / minuteInMilliseconds);
		return minutes === 1
			? `a minute ${suffix}`
			: `${minutes} minutes ${suffix}`;
	}

	if (since < dayInMilliseconds) {
		const hours = Math.floor(since / hourInMilliseconds);
		return hours === 1 ? `an hour ${suffix}` : `${hours} hours ${suffix}`;
	}

	if (since < monthInMilliseconds) {
		const days = Math.floor(since / dayInMilliseconds);
		return days === 1 ? `a day ${suffix}` : `${days} days ${suffix}`;
	}

	if (since < yearInMilliseconds) {
		const months = Math.floor(since / monthInMilliseconds);
		return months === 1 ? `a month ${suffix}` : `${months} months ${suffix}`;
	}

	const years = Math.floor(since / yearInMilliseconds);
	return years === 1 ? `a year ${suffix}` : `${years} years ${suffix}`;
}

/**
 * Formats a date into a string with the format of `Month Day, Year`
 */
export function formatDate(date: string) {
	return new Date(date).toLocaleDateString("en-US", {
		month: "long",
		day: "2-digit",
		year: "numeric"
	});
}
