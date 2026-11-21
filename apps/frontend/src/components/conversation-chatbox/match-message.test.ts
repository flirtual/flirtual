import { describe, expect, it } from "vitest";

import { isMatchMessage } from "./match-message";

describe("isMatchMessage", () => {
	it("recognises the system message the API sends on a match", () => {
		expect(isMatchMessage({ type: "SystemMessage", plaintext: "It's a match!" })).toBe(true);
	});

	it("ignores a user who types the same words", () => {
		expect(isMatchMessage({ type: "UserMessage", plaintext: "It's a match!" })).toBe(false);
	});

	it("ignores other system messages", () => {
		expect(isMatchMessage({ type: "SystemMessage", plaintext: "It's a match! Say hi" })).toBe(false);
	});
});
