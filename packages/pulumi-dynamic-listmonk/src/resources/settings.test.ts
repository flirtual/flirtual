import { afterEach, describe, expect, it, vi } from "vitest";

import { api, ok, stubListmonk } from "../fetch.fixtures.ts";
import { settingsOperations as settings } from "./settings.ts";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const current = {
  "app.root_url": "https://old.example",
  "app.site_name": "Listmonk",
  smtp: [{ host: "smtp.example", password: "••••••" }],
};

describe("create and update", () => {
  it("puts every current setting back with the given ones over them, then waits out the restart", async () => {
    vi.useFakeTimers();
    const sent = stubListmonk({
      "GET /health": [ok(true), ok(true)],
      "GET /settings": [ok(current)],
      "PUT /settings": [ok(true)],
    });

    const applying = settings.create(api, { "app.root_url": "https://news.example" });
    await vi.runAllTimersAsync();
    const applied = await applying;

    expect(applied).toEqual({ "app.root_url": "https://news.example" });
    expect(sent.map(({ route }) => route)).toEqual([
      "GET /health",
      "GET /settings",
      "PUT /settings",
      "GET /health",
    ]);
    // An empty secret keeps the stored one.
    expect(sent[2]!.body).toEqual({
      "app.root_url": "https://news.example",
      "app.site_name": "Listmonk",
      smtp: [{ host: "smtp.example", password: "" }],
    });
  });

  it("refuses a setting Listmonk doesn't have", async () => {
    stubListmonk({ "GET /health": [ok(true)], "GET /settings": [ok(current)] });

    await expect(settings.create(api, { "app.nope": 1 })).rejects.toThrow(
      "Listmonk has no settings named app.nope.",
    );
  });
});

describe("read", () => {
  it("reads back only the managed settings, keeping masked secrets as applied", async () => {
    stubListmonk({ "GET /settings": [ok(current)] });

    const read = await settings.read(api, "settings", {
      "app.root_url": "https://news.example",
      smtp: [{ host: "smtp.example", password: "hunter2" }],
    });

    expect(read).toEqual({
      "app.root_url": "https://old.example",
      smtp: [{ host: "smtp.example", password: "hunter2" }],
    });
    expect(settings.inputs!(read!)).toEqual(read);
  });

  it("can't import, since secrets are unreadable", async () => {
    stubListmonk({ "GET /settings": [ok(current)] });

    await expect(settings.read(api, "settings", {})).rejects.toThrow(
      "Listmonk settings can't be imported; secrets are unreadable.",
    );
  });
});
