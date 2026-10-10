import * as pulumi from "@pulumi/pulumi";
import { afterEach, beforeAll, expect, it, vi } from "vitest";

import { Provider, WebhookIntegration } from "./index.ts";

const registered: Array<pulumi.runtime.MockResourceArgs> = [];

const settled = (resource: pulumi.Resource) =>
	new Promise((resolve) => resource.urn.apply(resolve));

const bearer = (token: string) => ({
	[pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
	value: JSON.stringify({ authorization: `Bearer ${token}` }),
});

afterEach(() => {
	vi.unstubAllEnvs();
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

it("points at the v2 API with the secret key as a Bearer token, sending JSON", async () => {
	const provider = new Provider("revenuecat", { token: "sk_test" });
	await new Promise((resolve) => provider.urn.apply(resolve));

	const { inputs } = registered.find(({ name }) => name === "revenuecat")!;
	expect(inputs["fetch:baseUrl"]).toBe("https://api.revenuecat.com/v2");
	expect(inputs["fetch:headers"]).toEqual({
		[pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
		value: JSON.stringify({ authorization: "Bearer sk_test" }),
	});
	expect(inputs["fetch:encoding"]).toBe("json");
});

it("takes the key from REVENUECAT_TOKEN when not given", async () => {
	vi.stubEnv("REVENUECAT_TOKEN", "sk_env");

	await settled(new Provider("revenuecat-env"));

	const { inputs } = registered.find(({ name }) => name === "revenuecat-env")!;
	expect(inputs["fetch:headers"]).toEqual(bearer("sk_env"));
});

it("falls back to the revenuecat:token config", async () => {
	vi.stubEnv("REVENUECAT_TOKEN", "");
	pulumi.runtime.setAllConfig({ "revenuecat:token": "sk_config" }, ["revenuecat:token"]);

	await settled(new Provider("revenuecat-config"));

	const { inputs } = registered.find(({ name }) => name === "revenuecat-config")!;
	expect(inputs["fetch:headers"]).toEqual(bearer("sk_config"));
});

it("fails without a key from anywhere", () => {
	vi.stubEnv("REVENUECAT_TOKEN", "");

	expect(() => new Provider("revenuecat-missing")).toThrow("revenuecat:token");
});

it("registers as revenuecat:WebhookIntegration with its inputs", async () => {
	vi.stubEnv("REVENUECAT_TOKEN", "sk_test");

	const webhook = new WebhookIntegration("webhook", {
		project_id: "proj_1",
		name: "api",
		url: "https://api.example/v1/revenuecat",
		environment: "production",
		authorization_header: "Bearer secret",
	});
	await new Promise((resolve) => webhook.urn.apply(resolve));

	const { type, inputs } = registered.find(({ name }) => name === "webhook")!;
	expect(type).toBe("pulumi-nodejs:dynamic/revenuecat:WebhookIntegration");
	expect(inputs).toMatchObject({
		project_id: "proj_1",
		name: "api",
		url: "https://api.example/v1/revenuecat",
		environment: "production",
		authorization_header: "Bearer secret",
	});
});
