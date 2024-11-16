import { capitalize } from "remeda";

const secondInMilliseconds = 1e3;
const minuteInMilliseconds = 6e4;
const hourInMilliseconds = 3.6e6;
const dayInMilliseconds = 8.64e7;
const monthInMilliseconds = 2.628e9;
const yearInMilliseconds = 3.154e10;

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

export interface RelativeTimeOptions {
	approximate?: boolean;
	approximateTo?: number;
	suffix?: string;
	capitalize?: boolean;
}

function maybeCapitalize<T extends string>(
	value: T,
	shouldCapitalize: boolean
): Capitalize<T> | T {
	return shouldCapitalize ? capitalize(value) : value;
}

export function relativeTime(date: Date, options: RelativeTimeOptions = {}) {
	const {
		approximate = true,
		approximateTo = 5,
		capitalize: shouldCapitalize = true,
		suffix = "ago"
	} = options;

	const since = Date.now() - date.getTime();

	if (approximate && since < secondInMilliseconds * approximateTo)
		return maybeCapitalize("just now", shouldCapitalize);

	if (since < minuteInMilliseconds) {
		const seconds = Math.floor(since / secondInMilliseconds);
		return maybeCapitalize(
			seconds === 1 ? `a second ${suffix}` : `${seconds} seconds ${suffix}`,
			shouldCapitalize
		);
	}

	if (since < hourInMilliseconds) {
		const minutes = Math.floor(since / minuteInMilliseconds);
		return maybeCapitalize(
			minutes === 1 ? `a minute ${suffix}` : `${minutes} minutes ${suffix}`,
			shouldCapitalize
		);
	}

	if (since < dayInMilliseconds) {
		const hours = Math.floor(since / hourInMilliseconds);
		return maybeCapitalize(
			hours === 1 ? `an hour ${suffix}` : `${hours} hours ${suffix}`,
			shouldCapitalize
		);
	}

	if (since < monthInMilliseconds) {
		const days = Math.floor(since / dayInMilliseconds);
		return maybeCapitalize(
			days === 1 ? `a day ${suffix}` : `${days} days ${suffix}`,
			shouldCapitalize
		);
	}

	if (since < yearInMilliseconds) {
		const months = Math.floor(since / monthInMilliseconds);
		return maybeCapitalize(
			months === 1 ? `a month ${suffix}` : `${months} months ${suffix}`,
			shouldCapitalize
		);
	}

	const years = Math.floor(since / yearInMilliseconds);
	return maybeCapitalize(
		years === 1 ? `a year ${suffix}` : `${years} years ${suffix}`,
		shouldCapitalize
	);
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
