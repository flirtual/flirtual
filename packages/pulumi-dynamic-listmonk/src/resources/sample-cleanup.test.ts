import { afterEach, expect, it, vi } from "vitest";

import { api, ok, stubListmonk } from "../fetch.fixtures.ts";
import { SampleCleanupResource } from "./sample-cleanup.ts";

const cleanup = new SampleCleanupResource();

afterEach(() => {
	vi.unstubAllGlobals();
});

const lists = "GET /lists?minimal=true";
const page = (...results: Array<object>) =>
	ok({ results, total: results.length, page: 1, per_page: results.length });

const subscribers = `GET /subscribers?${new URLSearchParams({
	per_page: "all",
	query: "subscribers.email in ('john@example.com', 'anon@example.com')",
})}`;

it("deletes the seeded lists and example subscribers", async () => {
	const sent = stubListmonk({
		[lists]: [page({ id: 1, name: "Default list" }, { id: 2, name: "Opt-in list" })],
		"DELETE /lists/1": [ok(true)],
		"DELETE /lists/2": [ok(true)],
		[subscribers]: [ok({ results: [{ id: 1 }, { id: 2 }] })],
		"DELETE /subscribers/1": [ok(true)],
		"DELETE /subscribers/2": [ok(true)],
	});

	await cleanup.create(api);

	expect(sent.map(({ route }) => route)).toEqual([
		lists,
		"DELETE /lists/1",
		"DELETE /lists/2",
		subscribers,
		"DELETE /subscribers/1",
		"DELETE /subscribers/2",
	]);
});

it("leaves a seeded id alone once it holds another list", async () => {
	const sent = stubListmonk({
		[lists]: [page({ id: 1, name: "Newsletter" }, { id: 2, name: "Beta testers" })],
		[subscribers]: [ok({ results: [] })],
	});

	await cleanup.create(api);

	expect(sent.map(({ route }) => route)).toEqual([lists, subscribers]);
});

it("moves on when the seeded lists are already gone", async () => {
	const sent = stubListmonk({
		[lists]: [ok([])],
		[subscribers]: [ok({ results: [] })],
	});

	await cleanup.create(api);

	expect(sent.map(({ route }) => route)).toEqual([lists, subscribers]);
});

it("stays in state after a refresh, with nothing to read", async () => {
	expect(await cleanup.read()).toEqual({});
});
