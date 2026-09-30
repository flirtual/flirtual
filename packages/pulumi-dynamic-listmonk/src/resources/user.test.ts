import { afterEach, expect, it, vi } from "vitest";

import { api, ok, stubListmonk } from "../fetch.fixtures.ts";
import { UserResource } from "./user.ts";

const user = new UserResource();

afterEach(() => {
  vi.unstubAllGlobals();
});

const inputs = { username: "flirtual", roleId: "3" };
const body = {
  username: "flirtual",
  name: "flirtual",
  type: "api",
  status: "enabled",
  user_role_id: 3,
};
// Listmonk answers with the whole user; the live object keeps what the stack reads.
const answered = {
  id: 5,
  username: "flirtual",
  user_role_id: 3,
  name: "flirtual",
  status: "enabled",
};
const live = { id: 5, username: "flirtual", user_role_id: 3, token: "token" };

it("creates an API user and keeps the token only the create returns", async () => {
  const sent = stubListmonk({ "POST /users": [ok({ ...answered, password: "token" })] });

  const created = await user.create(api, inputs);

  expect(created).toEqual(live);
  expect(user.id(created)).toBe("5");
  expect(sent).toEqual([{ route: "POST /users", body }]);
});

it("fails when the create returns no token", async () => {
  stubListmonk({ "POST /users": [ok(answered)] });

  await expect(user.create(api, inputs)).rejects.toThrow(
    'Listmonk didn\'t return a token for "flirtual".',
  );
});

it("keeps the stored token through a read", async () => {
  stubListmonk({ "GET /users/5": [ok({ ...answered, username: "renamed" })] });

  const read = await user.read(api, "5", inputs, live);

  expect(read).toEqual({ ...live, username: "renamed" });
  expect(user.inputs(read!)).toEqual({ username: "renamed", roleId: "3" });
});

it("can't import, since the token is unreadable", async () => {
  await expect(user.read(api, "5", inputs)).rejects.toThrow(
    'Listmonk user "5" can\'t be imported; its token is unreadable.',
  );
});

it("keeps the stored token through an update", async () => {
  const sent = stubListmonk({ "PUT /users/5": [ok(answered)] });

  const updated = await user.update(api, "5", inputs, { ...inputs, output: live });

  expect(updated).toEqual(live);
  expect(sent).toEqual([{ route: "PUT /users/5", body }]);
});
