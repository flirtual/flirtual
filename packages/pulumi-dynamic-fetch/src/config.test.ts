import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, expectTypeOf, it } from "vitest";

import { defineConfig } from "./config.ts";
import { FetchResource } from "./resource.ts";

const registered: Array<pulumi.runtime.MockResourceArgs> = [];

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

const settled = (resource: pulumi.Resource) =>
	new Promise((resolve) => resource.urn.apply(resolve));

interface CounterInputs {
	start: number;
}

interface LiveCounter {
	id: string;
	count: number;
}

class Counter extends FetchResource<CounterInputs, LiveCounter> {
	readonly secretOutputs = ["output" as const];

	async create(_api: unknown, { start }: CounterInputs) {
		return { id: "counter", count: start };
	}

	async read(_api: unknown, id: string) {
		return { id, count: 0 };
	}

	async delete() {}

	id(live: LiveCounter) {
		return live.id;
	}
}

const {
	Provider,
	Webhook,
	Counter: CounterResource,
} = defineConfig({
	module: "example",
	// Each argument left out has a default, which may itself be an Output, as a secret config is.
	provider: (args: { site?: pulumi.Input<string>; token?: pulumi.Input<string> }, { config }) => {
		const { site = config.get("site") ?? "fallback", token = pulumi.secret("fallback-key") } = args;

		return {
			baseUrl: pulumi.interpolate`https://${site}.example.com/api`,
			headers: { authorization: pulumi.interpolate`Bearer ${token}` },
			encoding: "form",
		};
	},
	resources: {
		Webhook: {
			create: "post /webhooks",
			read: "get /webhooks/{id}",
			delete: "delete /webhooks/{id}",
		},
		Counter,
	},
});

const { Provider: OtherProvider } = defineConfig({
	module: "other",
	provider: () => ({ baseUrl: "https://other.example" }),
	resources: {},
});

const providerOf = (name: string) =>
	registered.find((resource) => resource.name === name)!.provider;

describe("Provider", () => {
	it("builds its connection from its arguments, keeping the headers secret", async () => {
		await settled(new Provider("example", { site: "acme", token: "key" }));

		const { type, inputs } = registered.find(({ name }) => name === "example")!;
		expect(type).toBe("pulumi:providers:pulumi-nodejs");
		expect(inputs["fetch:baseUrl"]).toBe("https://acme.example.com/api");
		expect(inputs["fetch:headers"]).toEqual({
			[pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
			value: JSON.stringify({ authorization: "Bearer key" }),
		});
		expect(inputs["fetch:encoding"]).toBe("form");
	});

	it("fills the arguments it isn't given from their defaults", async () => {
		await settled(new Provider("defaulted"));

		const { inputs } = registered.find(({ name }) => name === "defaulted")!;
		expect(inputs["fetch:baseUrl"]).toBe("https://fallback.example.com/api");
		expect(inputs["fetch:headers"]).toEqual({
			[pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
			value: JSON.stringify({ authorization: "Bearer fallback-key" }),
		});
	});

	it("gives the provider function the config named after the module", async () => {
		pulumi.runtime.setAllConfig({ "example:site": "configured" });
		await settled(new Provider("configured"));
		pulumi.runtime.setAllConfig({});

		const { inputs } = registered.find(({ name }) => name === "configured")!;
		expect(inputs["fetch:baseUrl"]).toBe("https://configured.example.com/api");
	});

	it("takes its arguments as the provider function declares them", () => {
		expectTypeOf<ConstructorParameters<typeof Provider>[1]>().toEqualTypeOf<
			{ site?: pulumi.Input<string>; token?: pulumi.Input<string> } | undefined
		>();
	});
});

describe("resources", () => {
	it("registers each resource under the module, named by its key", async () => {
		await settled(new Webhook("webhook", { name: "api", url: "https://api.example/hooks" }));

		const { type, inputs } = registered.find(({ name }) => name === "webhook")!;
		expect(type).toBe("pulumi-nodejs:dynamic/example:Webhook");
		expect(inputs).toMatchObject({ name: "api", url: "https://api.example/hooks" });
	});

	it("registers a FetchResource subclass the same way", async () => {
		await settled(new CounterResource("counter", { start: 2 }));

		const { type, inputs } = registered.find(({ name }) => name === "counter")!;
		expect(type).toBe("pulumi-nodejs:dynamic/example:Counter");
		expect(inputs).toMatchObject({ start: 2 });
	});

	it("types a FetchResource subclass's arguments and live object from its class", () => {
		expectTypeOf<ConstructorParameters<typeof CounterResource>[1]>().toEqualTypeOf<{
			start: pulumi.Input<number>;
		}>();
		expectTypeOf<InstanceType<typeof CounterResource>["count"]>().toEqualTypeOf<
			pulumi.Output<number>
		>();
	});
});

describe("a resource's provider", () => {
	it("is the one it's given", async () => {
		const provider = new Provider("given", { site: "acme", token: "key" });
		await settled(new Webhook("given-webhook", { name: "a" }, { provider }));

		expect(providerOf("given-webhook")).toBe(`${String(await settled(provider))}::given-id`);
	});

	it("is otherwise one made from the defaults, shared by every resource of the config", async () => {
		await settled(new Webhook("first", { name: "a" }));
		await settled(new CounterResource("second", { start: 1 }));

		const defaults = registered.filter(({ name }) => name === "default_example");
		expect(defaults).toHaveLength(1);
		expect(defaults[0]!.inputs["fetch:baseUrl"]).toBe("https://fallback.example.com/api");
		expect(providerOf("first")).toMatch(
			/::pulumi:providers:pulumi-nodejs::default_example::default_example-id$/u,
		);
		expect(providerOf("second")).toBe(providerOf("first"));
	});

	it("can't be another config's, since every config's provider has the same type", () => {
		const other = new OtherProvider("other");

		expect(() => new Webhook("mismatched", { name: "a" }, { provider: other })).toThrow(
			'example:Webhook "mismatched" needs a provider from the example config.',
		);
	});
});
