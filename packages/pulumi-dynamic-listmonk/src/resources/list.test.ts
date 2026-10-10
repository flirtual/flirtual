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
	it("creates the list under whatever id Listmonk picks", async () => {
		const sent = stubListmonk({ "POST /lists": [ok({ ...live, id: 7 })] });

		expect(list.id(await list.create(api, fields))).toBe("7");
		expect(sent).toEqual([{ route: "POST /lists", body: fields }]);
	});
});

describe("read, update and delete", () => {
	it("reads the list's fields back", async () => {
		stubListmonk({ [lists]: [page({ ...live, description: "changed" }, { ...live, id: 2 })] });

		const read = await list.read(api, "1");

		expect(list.inputs(read!, fields)).toEqual({ ...fields, description: "changed" });
	});

	it("reads back only the fields the inputs set, so an unset one isn't drift", () => {
		const inputs = { name: "Newsletter", type: "public" as const, optin: "single" as const };

		expect(list.inputs(live, inputs)).toEqual(inputs);
	});

	it("reads a deleted list as gone", async () => {
		stubListmonk({ [lists]: [page({ ...live, id: 2 })] });

		expect(await list.read(api, "1")).toBeUndefined();
	});

	it("reads a list as gone when Listmonk has no lists at all", async () => {
		stubListmonk({ [lists]: [ok([])] });

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
