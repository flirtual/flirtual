import { readFileSync, statSync } from "node:fs";

import { afterEach, expect, it, vi } from "vitest";

const commands: Array<string> = [];
const files: Record<string, { content: string; mode: number }> = {};

const detail = {
	hostname: "news.latest.flirtual.dev",
	configured: true,
	dns_requirements: {
		a: ["66.241.124.1"],
		aaaa: ["2a09:8280:1::1"],
		cname: "2p5od2j.flirtual-latest-listmonk.fly.dev",
		acme_challenge: { name: "_acme-challenge.news.latest.flirtual.dev", target: "x.flydns.net" },
		ownership: {
			name: "_fly-ownership.news.latest.flirtual.dev",
			app_value: "app-yjegnq0",
			org_value: "org-p0exr",
		},
	},
};

function record(templates: TemplateStringsArray, values: Array<string | Array<string>>) {
	for (const value of values.flat())
		if (value.endsWith(".pem"))
			files[value.split("/").at(-1)!] = {
				content: readFileSync(value, "utf8"),
				mode: statSync(value).mode & 0o777,
			};

	commands.push(
		templates
			.flatMap((chunk, index) => [chunk, ...(index < values.length ? [values[index]!].flat() : [])])
			.join(" ")
			.replaceAll(/\/\S+\/(\w+\.pem)/gu, "<$1>")
			.replaceAll(/\s+/gu, " ")
			.trim(),
	);
}

vi.mock("../client.ts", () => ({
	flyJson: async (templates: TemplateStringsArray, ...values: Array<string | Array<string>>) => {
		record(templates, values);
		return detail;
	},
	flyDelete: async (templates: TemplateStringsArray, ...values: Array<string | Array<string>>) => {
		record(templates, values);
	},
}));

const { provider } = await import("./certificate.ts");

afterEach(() => {
	commands.length = 0;
	for (const name of Object.keys(files)) delete files[name];
});

const inputs = {
	app: "flirtual-latest-listmonk",
	hostname: "news.latest.flirtual.dev",
	fullchain: "-----BEGIN CERTIFICATE-----\nchain\n-----END CERTIFICATE-----\n",
	privateKey: "-----BEGIN EC PRIVATE KEY-----\nkey\n-----END EC PRIVATE KEY-----\n",
};

const created = async () => (await provider.create(inputs)).outs!;

const imported =
	"certs import news.latest.flirtual.dev --app flirtual-latest-listmonk --fullchain <fullchain.pem> --private-key <key.pem>";

it("imports the certificate it's given instead of asking Let's Encrypt for one", async () => {
	const { id, outs } = await provider.create(inputs);

	expect(commands).toEqual([imported]);
	expect(files).toEqual({
		"fullchain.pem": { content: inputs.fullchain, mode: 0o600 },
		"key.pem": { content: inputs.privateKey, mode: 0o600 },
	});
	expect(id).toBe("flirtual-latest-listmonk/news.latest.flirtual.dev");
	expect(outs).toEqual({
		...inputs,
		dnsRequirements: {
			cname: "2p5od2j.flirtual-latest-listmonk.fly.dev",
			ownership: {
				name: "_fly-ownership.news.latest.flirtual.dev",
				appValue: "app-yjegnq0",
				orgValue: "org-p0exr",
			},
		},
	});
});

it("imports a renewed certificate in place", async () => {
	const olds = await created();
	commands.length = 0;
	const news = { ...inputs, fullchain: "renewed" };

	expect(await provider.diff!("id", olds, news)).toEqual({ changes: true, replaces: [] });

	const { outs } = await provider.update!("id", olds, news);

	expect(commands).toEqual([imported]);
	expect(outs!.fullchain).toBe("renewed");
});

it("replaces the certificate when its hostname changes", async () => {
	const olds = await created();

	expect(
		await provider.diff!("id", olds, { ...inputs, hostname: "api.latest.flirtual.dev" }),
	).toEqual({ changes: true, replaces: ["hostname"] });
});

it("leaves an unchanged certificate alone", async () => {
	const olds = await created();

	expect(await provider.diff!("id", olds, inputs)).toEqual({ changes: false, replaces: [] });
});
