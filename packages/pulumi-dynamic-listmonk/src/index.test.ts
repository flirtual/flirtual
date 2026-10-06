import * as pulumi from "@pulumi/pulumi";
import { afterEach, beforeAll, expect, it } from "vitest";

import { List, Provider, Role, SampleCleanup, Settings, User } from "./index.ts";

const registered: Array<pulumi.runtime.MockResourceArgs> = [];

const settled = (resource: pulumi.Resource) =>
	new Promise((resolve) => resource.urn.apply(resolve));

const secret = (value: unknown) => ({
	[pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
	value: JSON.stringify(value),
});

afterEach(() => {
	pulumi.runtime.setAllConfig({});
});

beforeAll(async () => {
	await pulumi.runtime.setMocks(
		{
			newResource: (args) => {
				registered.push(args);
				return { id: `${args.name}-id`, state: args.inputs };
			},
			call: (args) => args.inputs,
		},
		"project",
		"stack",
	);
});

it("points at the instance's /api and signs in as the admin user, sending no static auth", async () => {
	await settled(
		new Provider("listmonk", {
			endpoint: "https://news.example",
			username: "admin",
			password: "hunter22",
		}),
	);

	const { inputs } = registered.find(({ name }) => name === "listmonk")!;
	expect(inputs["fetch:baseUrl"]).toBe("https://news.example/api");
	expect(inputs["fetch:headers"]).toEqual(secret({}));
	expect(inputs["fetch:credentials"]).toEqual(secret({ username: "admin", password: "hunter22" }));
	expect(inputs["fetch:encoding"]).toBe("json");
});

it("sends the headers it's given, such as a Cloudflare Access service token, with every request", async () => {
	await settled(
		new Provider("listmonk-headers", {
			endpoint: "https://news.example",
			username: "admin",
			password: "hunter22",
			headers: { "cf-access-client-id": "id.access" },
		}),
	);

	const { inputs } = registered.find(({ name }) => name === "listmonk-headers")!;
	expect(inputs["fetch:headers"]).toEqual(secret({ "cf-access-client-id": "id.access" }));
});

it("falls back to the listmonk:endpoint, listmonk:username and listmonk:password config", async () => {
	pulumi.runtime.setAllConfig(
		{
			"listmonk:endpoint": "https://config.example",
			"listmonk:username": "config-admin",
			"listmonk:password": "config-password",
		},
		["listmonk:password"],
	);

	await settled(new Provider("listmonk-config"));

	const { inputs } = registered.find(({ name }) => name === "listmonk-config")!;
	expect(inputs["fetch:baseUrl"]).toBe("https://config.example/api");
	expect(inputs["fetch:credentials"]).toEqual(
		secret({ username: "config-admin", password: "config-password" }),
	);
});

it("registers each resource under the listmonk module, keeping its type name", async () => {
	pulumi.runtime.setAllConfig({
		"listmonk:endpoint": "https://news.example",
		"listmonk:username": "admin",
		"listmonk:password": "hunter22",
	});

	const resources = [
		new List("list", { name: "Newsletter", type: "public", optin: "single" }),
		new Role("role", { name: "Flirtual", permissions: [] }),
		new User("user", { username: "flirtual", roleId: "3" }),
		new Settings("settings", {}),
		new SampleCleanup("sample-cleanup", {}),
	];
	await Promise.all(
		resources.map((resource) => new Promise((resolve) => resource.urn.apply(resolve))),
	);

	expect(
		["list", "role", "user", "settings", "sample-cleanup"].map(
			(name) => registered.find((resource) => resource.name === name)!.type,
		),
	).toEqual([
		"pulumi-nodejs:dynamic/listmonk:List",
		"pulumi-nodejs:dynamic/listmonk:Role",
		"pulumi-nodejs:dynamic/listmonk:User",
		"pulumi-nodejs:dynamic/listmonk:Settings",
		"pulumi-nodejs:dynamic/listmonk:SampleCleanup",
	]);
});
