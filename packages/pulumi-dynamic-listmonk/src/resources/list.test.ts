import { afterEach, describe, expect, it, vi } from "vitest";

import { api, ok, respond, stubListmonk } from "../fetch.fixtures.ts";
import { listOperations as list } from "./list.ts";

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

describe("create", () => {
  it("takes over the list at `listId` when it exists", async () => {
    const sent = stubListmonk({
      "GET /health": [ok(true)],
      "GET /lists/1": [ok({ ...live, name: "Default list" })],
      "PUT /lists/1": [ok(live)],
    });

    const created = await list.create(api, { listId: 1, ...fields });

    expect(list.id(created)).toBe("1");
    expect(sent).toEqual([
      { route: "GET /health", body: undefined },
      { route: "GET /lists/1", body: undefined },
      { route: "PUT /lists/1", body: fields },
    ]);
  });

  it("creates the list when `listId` is free and Listmonk numbers it the same", async () => {
    const sent = stubListmonk({
      "GET /health": [ok(true)],
      "GET /lists/1": [respond(404)],
      "POST /lists": [ok(live)],
    });

    expect(list.id(await list.create(api, { listId: 1, ...fields }))).toBe("1");
    expect(sent.at(-1)).toEqual({ route: "POST /lists", body: fields });
  });

  it("fails rather than keep a list Listmonk numbered differently", async () => {
    stubListmonk({
      "GET /health": [ok(true)],
      "GET /lists/1": [respond(404)],
      "POST /lists": [ok({ ...live, id: 4 })],
    });

    await expect(list.create(api, { listId: 1, ...fields })).rejects.toThrow(
      'Listmonk created "Newsletter" as list 4, not 1.',
    );
  });

  it("creates a list without `listId` under whatever id Listmonk picks", async () => {
    stubListmonk({ "GET /health": [ok(true)], "POST /lists": [ok({ ...live, id: 7 })] });

    expect(list.id(await list.create(api, fields))).toBe("7");
  });
});

describe("read, update and delete", () => {
  it("reads the list's fields back, with its id as `listId`", async () => {
    stubListmonk({ "GET /lists/1": [ok({ ...live, description: "changed" })] });

    const read = await list.read(api, "1", { listId: 1, ...fields });

    expect(list.inputs!(read!)).toEqual({ listId: 1, ...fields, description: "changed" });
  });

  it("reads a deleted list as gone", async () => {
    stubListmonk({ "GET /lists/1": [respond(404)] });

    expect(await list.read(api, "1", fields)).toBeUndefined();
  });

  it("updates and deletes by id", async () => {
    const sent = stubListmonk({ "PUT /lists/1": [ok(live)], "DELETE /lists/1": [ok(true)] });

    await list.update!(api, "1", fields, { ...fields, output: live });
    await list.delete(api, "1", fields);

    expect(sent).toEqual([
      { route: "PUT /lists/1", body: fields },
      { route: "DELETE /lists/1", body: undefined },
    ]);
  });
});
