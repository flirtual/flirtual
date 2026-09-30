import { afterEach, describe, expect, it, vi } from "vitest";

import { call, ready } from "./client.ts";
import { api, ok, respond, stubListmonk } from "./fetch.fixtures.ts";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("call", () => {
  it("returns the payload inside Listmonk's `data` wrapper", async () => {
    stubListmonk({ "GET /lists/1": [ok({ id: 1, name: "Newsletter" })] });

    expect(await call(api, "GET", "/lists/1")).toEqual({ id: 1, name: "Newsletter" });
  });

  it("returns undefined for a 404", async () => {
    stubListmonk({ "GET /lists/9": [respond(404, { message: "not found" })] });

    expect(await call(api, "GET", "/lists/9")).toBeUndefined();
  });
});

describe("ready", () => {
  it("waits until /health answers, retrying failures and unhealthy answers", async () => {
    vi.useFakeTimers();
    const sent = stubListmonk({
      "GET /health": [respond(502), ok(false), ok(true)],
    });

    const waiting = ready(api);
    await vi.runAllTimersAsync();
    await waiting;

    expect(sent.map(({ route }) => route)).toEqual(["GET /health", "GET /health", "GET /health"]);
  });

  it("gives up after 60 attempts", async () => {
    vi.useFakeTimers();
    stubListmonk({ "GET /health": Array.from({ length: 60 }, () => respond(502)) });

    const waiting = ready(api).catch((error: unknown) => error);
    await vi.runAllTimersAsync();

    expect(await waiting).toEqual(new Error("https://listmonk.example/api never became healthy."));
  });
});
