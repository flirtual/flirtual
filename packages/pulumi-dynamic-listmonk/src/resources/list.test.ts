import { afterEach, describe, expect, it, vi } from "vitest";

import { api, ok, stubListmonk } from "../fetch.fixtures.ts";
import { ListResource } from "./list.ts";

const list = new ListResource();

afterEach(() => {
	vi.unstubAllGlobals();
});

const fields = {
	name: "Newsletter",
	type: "public" as const,
	optin: "single" as const,
	tags: [],
	description: "",
};

const live = { id: 1, uuid: "u", ...fields, subscriber_count: 0 };

// Every list, as `?minimal=true` answers: a page of results, or a bare array when there are none.
const lists = "GET /lists?minimal=true";
const page = (...results: Array<object>) =>
	ok({ results, total: results.length, page: 1, per_page: results.length });

describe("create", () => {
	it("takes over the list at `listId` when it exists", async () => {
		const sent = stubListmonk({
			[lists]: [page({ ...live, name: "Default list" }, { ...live, id: 2 })],
			"PUT /lists/1": [ok(live)],
		});

		const created = await list.create(api, { listId: 1, ...fields });

		expect(list.id(created)).toBe("1");
		expect(sent).toEqual([
			{ route: lists, body: undefined },
			{ route: "PUT /lists/1", body: fields },
		]);
	});

	it("creates the list when `listId` is free and Listmonk numbers it the same", async () => {
		const sent = stubListmonk({
			[lists]: [page({ ...live, id: 1 }, { ...live, id: 2 })],
			"POST /lists": [ok({ ...live, id: 3 })],
		});

		expect(list.id(await list.create(api, { listId: 3, ...fields }))).toBe("3");
		expect(sent).toEqual([
			{ route: lists, body: undefined },
			{ route: "POST /lists", body: fields },
		]);
	});

	it("creates the list when Listmonk has no lists at all", async () => {
		stubListmonk({ [lists]: [ok([])], "POST /lists": [ok(live)] });

		expect(list.id(await list.create(api, { listId: 1, ...fields }))).toBe("1");
	});

	it("fails rather than keep a list Listmonk numbered differently", async () => {
		stubListmonk({
			[lists]: [page({ ...live, id: 2 })],
			"POST /lists": [ok({ ...live, id: 4 })],
		});

		await expect(list.create(api, { listId: 1, ...fields })).rejects.toThrow(
			'Listmonk created "Newsletter" as list 4, not 1.',
		);
	});

	it("creates a list without `listId` under whatever id Listmonk picks", async () => {
		const sent = stubListmonk({ "POST /lists": [ok({ ...live, id: 7 })] });

		expect(list.id(await list.create(api, fields))).toBe("7");
		expect(sent.map(({ route }) => route)).toEqual(["POST /lists"]);
	});
});

describe("read, update and delete", () => {
	it("reads the list's fields back, with its id as `listId`", async () => {
		stubListmonk({ [lists]: [page({ ...live, description: "changed" }, { ...live, id: 2 })] });

		const read = await list.read(api, "1");

		expect(list.inputs(read!, { listId: 1, ...fields })).toEqual({
			listId: 1,
			...fields,
			description: "changed",
		});
	});

	it("reads back only the fields the inputs set, so an unset one isn't drift", () => {
		const inputs = { name: "Newsletter", type: "public" as const, optin: "single" as const };

		expect(list.inputs(live, inputs)).toEqual(inputs);
	});

	it("reads a deleted list as gone", async () => {
		stubListmonk({ [lists]: [page({ ...live, id: 2 })] });

		expect(await list.read(api, "1")).toBeUndefined();
	});

	it("updates and deletes by id", async () => {
		const sent = stubListmonk({ "PUT /lists/1": [ok(live)], "DELETE /lists/1": [ok(true)] });

		await list.update(api, "1", fields);
		await list.delete(api, "1");

		expect(sent).toEqual([
			{ route: "PUT /lists/1", body: fields },
			{ route: "DELETE /lists/1", body: undefined },
		]);
	});
});
