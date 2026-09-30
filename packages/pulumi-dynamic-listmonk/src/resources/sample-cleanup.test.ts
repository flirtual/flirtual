import { afterEach, expect, it, vi } from "vitest";

import { api, ok, stubListmonk } from "../fetch.fixtures.ts";
import { SampleCleanupResource } from "./sample-cleanup.ts";

const cleanup = new SampleCleanupResource();

afterEach(() => {
  vi.unstubAllGlobals();
});

const subscribers = `GET /subscribers?${new URLSearchParams({
  per_page: "all",
  query: "subscribers.email in ('john@example.com', 'anon@example.com')",
})}`;

it("deletes the seeded opt-in list and example subscribers", async () => {
  const sent = stubListmonk({
    "GET /lists/2": [ok({ id: 2, name: "Opt-in list" })],
    "DELETE /lists/2": [ok(true)],
    [subscribers]: [ok({ results: [{ id: 1 }, { id: 2 }] })],
    "DELETE /subscribers/1": [ok(true)],
    "DELETE /subscribers/2": [ok(true)],
  });

  await cleanup.create(api);

  expect(sent.map(({ route }) => route)).toEqual([
    "GET /lists/2",
    "DELETE /lists/2",
    subscribers,
    "DELETE /subscribers/1",
    "DELETE /subscribers/2",
  ]);
});

it("leaves list 2 alone once it's something else", async () => {
  const sent = stubListmonk({
    "GET /lists/2": [ok({ id: 2, name: "Beta testers" })],
    [subscribers]: [ok({ results: [] })],
  });

  await cleanup.create(api);

  expect(sent.map(({ route }) => route)).toEqual(["GET /lists/2", subscribers]);
});

it("stays in state after a refresh, with nothing to read", async () => {
  expect(await cleanup.read()).toEqual({});
});
