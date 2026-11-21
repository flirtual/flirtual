import { describe, expect, it } from "vitest";

import { createOffsetTimeFormatter, millisecondsUntilNextMinute } from "./date";

const instant = Date.UTC(2026, 0, 1, 12, 34, 56, 250);

describe("createOffsetTimeFormatter", () => {
	const format = createOffsetTimeFormatter("en-US");
	const formatTime = (instant: number, offsetSeconds: number) => format(instant, offsetSeconds).replace(/\s/gu, " ");

	it("formats the wall-clock time at a positive offset", () => {
		expect(formatTime(instant, 5.5 * 3600)).toBe("6:04 PM");
	});

	it("formats the wall-clock time at a negative offset", () => {
		expect(formatTime(instant, -5 * 3600)).toBe("7:34 AM");
	});

	it("formats UTC itself at offset zero", () => {
		expect(formatTime(instant, 0)).toBe("12:34 PM");
	});

	it("rolls over midnight into the next day's time", () => {
		expect(formatTime(Date.UTC(2026, 0, 1, 23, 30), 14 * 3600)).toBe("1:30 PM");
	});
});

describe("millisecondsUntilNextMinute", () => {
	it("counts down to the start of the next minute", () => {
		expect(millisecondsUntilNextMinute(instant)).toBe(3750);
	});

	it("waits a full minute when already on a minute boundary", () => {
		expect(millisecondsUntilNextMinute(Date.UTC(2026, 0, 1, 12, 35))).toBe(60_000);
	});
});
