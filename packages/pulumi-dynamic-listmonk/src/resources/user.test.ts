import { afterEach, expect, it, vi } from "vitest";

import { api, ok, stubListmonk } from "../fetch.fixtures.ts";
import { userOperations as user } from "./user.ts";

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
const live = { id: 5, username: "flirtual", user_role_id: 3 };

it("creates an API user and keeps the token only the create returns", async () => {
  const sent = stubListmonk({ "POST /users": [ok({ ...live, password: "token" })] });

  const created = await user.create(api, inputs);

  expect(created).toEqual({ ...live, password: "token" });
  expect(user.id(created)).toBe("5");
  expect(sent).toEqual([{ route: "POST /users", body }]);
});

it("fails when the create returns no token", async () => {
  stubListmonk({ "POST /users": [ok(live)] });

  await expect(user.create(api, inputs)).rejects.toThrow(
    'Listmonk didn\'t return a token for "flirtual".',
  );
});

it("keeps the stored token through a read", async () => {
  stubListmonk({ "GET /users/5": [ok({ ...live, username: "renamed" })] });

  const read = await user.read(api, "5", inputs, { ...live, password: "token" });

  expect(read).toEqual({ ...live, username: "renamed", password: "token" });
  expect(user.inputs!(read!)).toEqual({ username: "renamed", roleId: "3" });
});

it("can't import, since the token is unreadable", async () => {
  await expect(user.read(api, "5", inputs)).rejects.toThrow(
    'Listmonk user "5" can\'t be imported; its token is unreadable.',
  );
});

it("keeps the stored token through an update", async () => {
  const sent = stubListmonk({ "PUT /users/5": [ok(live)] });

  const updated = await user.update!(api, "5", inputs, {
    ...inputs,
    output: { ...live, password: "token" },
  });

  expect(updated).toEqual({ ...live, password: "token" });
  expect(sent).toEqual([{ route: "PUT /users/5", body }]);
});
