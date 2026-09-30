import { afterEach, expect, it, vi } from "vitest";

import { api, ok, stubListmonk } from "../fetch.fixtures.ts";
import { RoleResource } from "./role.ts";

const role = new RoleResource();

afterEach(() => {
  vi.unstubAllGlobals();
});

const inputs = { name: "Flirtual", permissions: ["lists:get_all", "subscribers:manage"] };
const live = { id: 3, ...inputs };

it("creates a user role and takes its id", async () => {
  const sent = stubListmonk({ "POST /roles/users": [ok(live)] });

  expect(role.id(await role.create(api, inputs))).toBe("3");
  expect(sent).toEqual([{ route: "POST /roles/users", body: inputs }]);
});

it("reads the role out of the list of roles, since Listmonk has no route for one", async () => {
  stubListmonk({
    "GET /roles/users": [ok([{ id: 1, name: "Super Admin", permissions: [] }, live])],
  });

  expect(await role.read(api, "3")).toEqual(live);
});

it("reads a role missing from the list as gone", async () => {
  stubListmonk({ "GET /roles/users": [ok([])] });

  expect(await role.read(api, "3")).toBeUndefined();
});

it("updates through /roles/users/{id} and deletes through /roles/{id}", async () => {
  const sent = stubListmonk({ "PUT /roles/users/3": [ok(live)], "DELETE /roles/3": [ok(true)] });

  await role.update(api, "3", inputs);
  await role.delete(api, "3");

  expect(sent).toEqual([
    { route: "PUT /roles/users/3", body: inputs },
    { route: "DELETE /roles/3", body: undefined },
  ]);
});

it("keeps the stored order of the same permissions, since they're a set", () => {
  const reordered = { ...live, permissions: ["subscribers:manage", "lists:get_all"] };

  expect(role.inputs(reordered, inputs)).toEqual(inputs);
});

it("reads permissions that changed as Listmonk has them", () => {
  const changed = { ...live, permissions: ["lists:get_all"] };

  expect(role.inputs(changed, inputs)).toEqual({
    name: "Flirtual",
    permissions: ["lists:get_all"],
  });
});
