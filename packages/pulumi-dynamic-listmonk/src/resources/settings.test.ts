import { afterEach, describe, expect, it, vi } from "vitest";

import { api, ok, stubListmonk } from "../fetch.fixtures.ts";
import { SettingsResource } from "./settings.ts";

const settings = new SettingsResource();

afterEach(() => {
	vi.unstubAllGlobals();
});

const current = {
	"app.root_url": "https://old.example",
	"app.site_name": "Listmonk",
	smtp: [{ host: "smtp.example", password: "••••••" }],
};

describe("create and update", () => {
	it("puts every current setting back with the given ones over them", async () => {
		const sent = stubListmonk({
			"GET /settings": [ok(current)],
			"PUT /settings": [ok(true)],
		});

		const applied = await settings.create(api, { "app.root_url": "https://news.example" });

		expect(applied).toEqual({ "app.root_url": "https://news.example" });
		expect(sent.map(({ route }) => route)).toEqual(["GET /settings", "PUT /settings"]);
		// An empty secret keeps the stored one.
		expect(sent[1]!.body).toEqual({
			"app.root_url": "https://news.example",
			"app.site_name": "Listmonk",
			smtp: [{ host: "smtp.example", password: "" }],
		});
	});

	it("overlays a nested object, keeping the fields it isn't given", async () => {
		const sent = stubListmonk({
			"GET /settings": [
				ok({
					...current,
					"bounce.actions": {
						hard: { count: 1, action: "blocklist" },
						soft: { count: 2, action: "none" },
					},
				}),
			],
			"PUT /settings": [ok(true)],
		});

		await settings.create(api, { "bounce.actions": { hard: { count: 3 } } });

		expect((sent[1]!.body as Record<string, unknown>)["bounce.actions"]).toEqual({
			hard: { count: 3, action: "blocklist" },
			soft: { count: 2, action: "none" },
		});
	});

	it("overlays array items by position, and keeps only as many as it's given", async () => {
		const sent = stubListmonk({
			"GET /settings": [
				ok({
					...current,
					smtp: [
						{ host: "smtp.example", password: "••••", msg_retry_delay: "10ms", from_addresses: [] },
						{
							host: "smtp.gmail.com",
							password: "••••",
							msg_retry_delay: "10ms",
							from_addresses: [],
						},
					],
				}),
			],
			"PUT /settings": [ok(true)],
		});

		await settings.create(api, { smtp: [{ host: "email-smtp.example", password: "s3cret" }] });

		expect((sent[1]!.body as Record<string, unknown>)["smtp"]).toEqual([
			{
				host: "email-smtp.example",
				password: "s3cret",
				msg_retry_delay: "10ms",
				from_addresses: [],
			},
		]);
	});

	it("keeps a stored secret it isn't given, by sending it back empty", async () => {
		const sent = stubListmonk({
			"GET /settings": [ok(current)],
			"PUT /settings": [ok(true)],
		});

		await settings.create(api, { smtp: [{ host: "other.example" }] });

		expect((sent[1]!.body as Record<string, unknown>)["smtp"]).toEqual([
			{ host: "other.example", password: "" },
		]);
	});

	it("sets the S3 secret key, which Listmonk leaves out of its settings while it's empty", async () => {
		const sent = stubListmonk({
			"GET /settings": [ok(current)],
			"PUT /settings": [ok(true)],
		});

		await settings.create(api, { "upload.s3.aws_secret_access_key": "s3cret" });

		expect(sent[1]!.body).toEqual({
			"app.root_url": "https://old.example",
			"app.site_name": "Listmonk",
			smtp: [{ host: "smtp.example", password: "" }],
			"upload.s3.aws_secret_access_key": "s3cret",
		});
	});

	it("refuses a setting Listmonk doesn't have", async () => {
		stubListmonk({ "GET /settings": [ok(current)] });

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
		expect(settings.inputs(read!)).toEqual(read);
	});

	it("reads back only the paths it sets, so a field Listmonk adds isn't drift", async () => {
		stubListmonk({
			"GET /settings": [
				ok({
					...current,
					smtp: [{ host: "smtp.example", password: "••••", msg_retry_delay: "10ms" }],
					"bounce.actions": { hard: { count: 1, action: "blocklist" } },
				}),
			],
		});

		const read = await settings.read(api, "settings", {
			smtp: [{ host: "smtp.example", password: "hunter2" }],
			"bounce.actions": { hard: { count: 1 } },
		});

		expect(read).toEqual({
			smtp: [{ host: "smtp.example", password: "hunter2" }],
			"bounce.actions": { hard: { count: 1 } },
		});
	});

	it("reads back array items beyond the ones it sets, so an extra one is drift", async () => {
		stubListmonk({
			"GET /settings": [
				ok({
					...current,
					smtp: [
						{ host: "smtp.example", password: "••••" },
						{ host: "smtp.gmail.com", password: "••••" },
					],
				}),
			],
		});

		const read = await settings.read(api, "settings", {
			smtp: [{ host: "smtp.example", password: "hunter2" }],
		});

		expect(read).toEqual({
			smtp: [
				{ host: "smtp.example", password: "hunter2" },
				{ host: "smtp.gmail.com", password: "••••" },
			],
		});
	});

	it("can't import, since secrets are unreadable", async () => {
		stubListmonk({ "GET /settings": [ok(current)] });

		await expect(settings.read(api, "settings", {})).rejects.toThrow(
			"Listmonk settings can't be imported; secrets are unreadable.",
		);
	});
});
