import * as pulumi from "@pulumi/pulumi";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createRequire } from "node:module";

import type { Api } from "./api.ts";
import { configKey } from "./provider.ts";
import { createProvider, FetchResource, type Operations } from "./resource.ts";

interface Inputs {
	name: string;
	url: string;
}

interface Live {
	id: string;
	name: string;
	url: string;
	created_at: number;
}

const live: Live = { id: "we_1", name: "a", url: "https://a.example", created_at: 1 };

function operations(overrides: Partial<Operations<Inputs, Live>> = {}): Operations<Inputs, Live> {
	return {
		create: vi.fn(async () => live),
		read: vi.fn(async () => live),
		update: vi.fn(async () => live),
		delete: vi.fn(async () => {}),
		id: (live) => live.id,
		...overrides,
	};
}

async function configured(ops: Operations<Inputs, Live>) {
	const provider = createProvider(ops);
	const values: Record<string, string> = {
		[configKey("baseUrl")]: "https://example.com",
		[configKey("headers")]: JSON.stringify({ authorization: "Bearer token" }),
		[configKey("encoding")]: "form",
	};
	const config = { require: (key: string) => values[key]! } as unknown as pulumi.Config;
	await provider.configure({ config } as pulumi.dynamic.ConfigureRequest);
	return provider;
}

// pulumi.dynamic.Resource stores its serialized implementation among the inputs.
const withProvider = (inputs: Inputs) => ({ ...inputs, __provider: "serialized" });

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("createProvider", () => {
	it("builds the API client from the provider's config", async () => {
		const create = vi.fn(async (api: Api) => {
			expect(api.connection).toEqual({
				baseUrl: "https://example.com",
				headers: { authorization: "Bearer token" },
				encoding: "form",
			});
			return live;
		});
		const provider = await configured(operations({ create }));

		await provider.create(withProvider({ name: "a", url: "https://a.example" }));

		expect(create).toHaveBeenCalledOnce();
	});

	it("creates with the inputs alone, and keeps the live object as `output`", async () => {
		const ops = operations();
		const provider = await configured(ops);

		const result = await provider.create(withProvider({ name: "a", url: "https://a.example" }));

		expect(ops.create).toHaveBeenCalledWith(expect.anything(), {
			name: "a",
			url: "https://a.example",
		});
		expect(result).toEqual({
			id: "we_1",
			outs: { name: "a", url: "https://a.example", output: live },
		});
	});

	it("reports a resource the API no longer has as gone", async () => {
		const provider = await configured(operations({ read: vi.fn(async () => undefined) }));

		const result = await provider.read("we_1", { name: "a", url: "https://a.example" });

		expect(result).toEqual({});
	});

	it("reads live values back over the stored inputs, through `inputs`", async () => {
		const drifted = { ...live, url: "https://changed.example" };
		const ops = operations({
			read: vi.fn(async () => drifted),
			inputs: ({ name, url }) => ({ name, url }),
		});
		const provider = await configured(ops);

		const result = await provider.read("we_1", { name: "a", url: "https://a.example" });

		expect(ops.read).toHaveBeenCalledWith(
			expect.anything(),
			"we_1",
			{ name: "a", url: "https://a.example" },
			undefined,
		);
		expect(result).toEqual({
			id: "we_1",
			props: { name: "a", url: "https://changed.example", output: drifted },
		});
	});

	it("gives `inputs` the stored inputs too, to keep what the live object can't tell apart", async () => {
		const inputs = vi.fn(({ name }: Live) => ({ name }));
		const provider = await configured(operations({ inputs }));

		await provider.read("we_1", { name: "a", url: "https://a.example" });

		expect(inputs).toHaveBeenCalledWith(live, { name: "a", url: "https://a.example" });
	});

	it("gives read the live object stored before it, for values the API only returns once", async () => {
		const ops = operations();
		const provider = await configured(ops);
		const stored = { ...live, created_at: 0 };

		await provider.read("we_1", { name: "a", url: "https://a.example", output: stored });

		expect(ops.read).toHaveBeenCalledWith(
			expect.anything(),
			"we_1",
			{ name: "a", url: "https://a.example" },
			stored,
		);
	});

	it("keeps the stored inputs on read when there is no `inputs` mapping", async () => {
		const drifted = { ...live, url: "https://changed.example" };
		const provider = await configured(operations({ read: vi.fn(async () => drifted) }));

		const result = await provider.read("we_1", { name: "a", url: "https://a.example" });

		expect(result).toEqual({
			id: "we_1",
			props: { name: "a", url: "https://a.example", output: drifted },
		});
	});

	it("updates in place with the new inputs", async () => {
		const ops = operations();
		const provider = await configured(ops);
		const olds = { name: "a", url: "https://a.example", output: live };

		const result = await provider.update(
			"we_1",
			olds,
			withProvider({ name: "b", url: "https://a.example" }),
		);

		expect(ops.update).toHaveBeenCalledWith(
			expect.anything(),
			"we_1",
			{ name: "b", url: "https://a.example" },
			olds,
		);
		expect(result).toEqual({ outs: { name: "b", url: "https://a.example", output: live } });
	});

	it("deletes by id", async () => {
		const ops = operations();
		const provider = await configured(ops);

		await provider.delete("we_1", { name: "a", url: "https://a.example", output: live });

		expect(ops.delete).toHaveBeenCalledWith(expect.anything(), "we_1", {
			name: "a",
			url: "https://a.example",
		});
	});
});

// Round-trips the provider the way Pulumi does: `pulumi.dynamic.Resource` serializes
// `() => provider`, and the dynamic provider host loads that text and calls its `handler`.
async function serialized<Provider>(provider: Provider): Promise<Provider> {
	const { text, exportName } = await pulumi.runtime.serializeFunction(() => provider);
	const module = { exports: {} as Record<string, () => Provider> };
	new Function("module", "exports", "require", text)(
		module,
		module.exports,
		createRequire(import.meta.url),
	);
	return module.exports[exportName]!();
}

describe("a serialized provider", () => {
	it("creates, diffs and deletes after a round trip through Pulumi's closure serializer", async () => {
		const provider = await serialized(
			createProvider<Inputs, Live>({
				create: async () => live,
				read: async () => live,
				update: async () => live,
				delete: async () => {},
				id: (live) => live.id,
			}),
		);
		const inputs = { name: "a", url: "https://a.example" };

		const created = await provider.create(withProvider(inputs));
		const diff = await provider.diff("we_1", { ...inputs, output: live }, withProvider(inputs));

		expect(created).toEqual({ id: "we_1", outs: { ...inputs, output: live } });
		expect(diff).toEqual({ changes: false, replaces: [] });
		await expect(provider.delete("we_1", { ...inputs, output: live })).resolves.toBeUndefined();
	});

	it("keeps the message of an API failure, which the provider host reports as the error", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("nope", { status: 500 })),
		);
		const provider = await serialized(
			createProvider<Inputs, Live>({
				create: async (api) => (await api.request<Live>("POST", "/things"))!,
				read: async () => live,
				delete: async () => {},
				id: (live) => live.id,
			}),
		);
		const values: Record<string, string> = {
			[configKey("baseUrl")]: "https://example.com",
			[configKey("headers")]: JSON.stringify({}),
			[configKey("encoding")]: "json",
		};
		const config = { require: (key: string) => values[key]! } as unknown as pulumi.Config;
		await provider.configure({ config } as pulumi.dynamic.ConfigureRequest);

		const error = await provider
			.create(withProvider({ name: "a", url: "https://a.example" }))
			.catch((error: unknown) => error);

		expect((error as Error).message).toBe("POST https://example.com/things failed with 500: nope");
	});
});

describe("authenticate", () => {
	it("trades the credentials for headers once, and sends them with every operation", async () => {
		const authenticate = vi.fn(async () => ({ cookie: "session=abc" }));
		const seen: Array<Record<string, string>> = [];
		const record = async (api: Api) => {
			seen.push(api.connection.headers);
			return live;
		};
		const provider = createProvider<Inputs, Live>(
			operations({ create: record, read: record }),
			authenticate,
		);
		const values: Record<string, string> = {
			[configKey("baseUrl")]: "https://example.com",
			[configKey("headers")]: JSON.stringify({ accept: "application/json" }),
			[configKey("encoding")]: "json",
			[configKey("credentials")]: JSON.stringify({ username: "admin", password: "secret" }),
		};
		const config = { require: (key: string) => values[key]! } as unknown as pulumi.Config;
		await provider.configure({ config } as pulumi.dynamic.ConfigureRequest);

		await provider.create(withProvider({ name: "a", url: "https://a.example" }));
		await provider.read("we_1", { name: "a", url: "https://a.example" });

		expect(authenticate).toHaveBeenCalledOnce();
		expect(authenticate).toHaveBeenCalledWith(
			{ baseUrl: "https://example.com", headers: { accept: "application/json" }, encoding: "json" },
			{ username: "admin", password: "secret" },
		);
		expect(seen).toEqual([
			{ accept: "application/json", cookie: "session=abc" },
			{ accept: "application/json", cookie: "session=abc" },
		]);
	});

	it("makes an operation that arrives during authentication wait for it", async () => {
		// The dynamic provider host caches a provider before its `configure` settles
		// (@pulumi/pulumi cmd/dynamic-provider), so another resource's operation can arrive mid-login.
		let logIn: (headers: Record<string, string>) => void = () => {};
		const loggedIn = new Promise<Record<string, string>>((resolve) => {
			logIn = resolve;
		});
		const seen: Array<Record<string, string>> = [];
		const provider = createProvider<Inputs, Live>(
			operations({
				read: async (api: Api) => {
					seen.push(api.connection.headers);
					return live;
				},
			}),
			() => loggedIn,
		);
		const values: Record<string, string> = {
			[configKey("baseUrl")]: "https://example.com",
			[configKey("headers")]: JSON.stringify({}),
			[configKey("encoding")]: "json",
			[configKey("credentials")]: JSON.stringify({}),
		};
		const config = { require: (key: string) => values[key]! } as unknown as pulumi.Config;

		const configuring = provider.configure({ config } as pulumi.dynamic.ConfigureRequest);
		const reading = provider.read("we_1", { name: "a", url: "https://a.example" });
		logIn({ cookie: "session=abc" });
		await configuring;
		await reading;

		expect(seen).toEqual([{ cookie: "session=abc" }]);
	});

	it("fails to configure when authentication fails", async () => {
		const provider = createProvider<Inputs, Live>(operations(), async () => {
			throw new Error("login refused");
		});
		const values: Record<string, string> = {
			[configKey("baseUrl")]: "https://example.com",
			[configKey("headers")]: JSON.stringify({}),
			[configKey("encoding")]: "json",
			[configKey("credentials")]: JSON.stringify({}),
		};
		const config = { require: (key: string) => values[key]! } as unknown as pulumi.Config;

		await expect(provider.configure({ config } as pulumi.dynamic.ConfigureRequest)).rejects.toThrow(
			"login refused",
		);
	});
});

describe("a FetchResource subclass", () => {
	class Webhook extends FetchResource<Inputs, Live> {
		readonly calls: Array<string> = [];

		private record(call: string) {
			this.calls.push(call);
			return live;
		}

		async create() {
			return this.record("create");
		}

		async read() {
			return this.record("read");
		}

		async update() {
			return this.record("update");
		}

		async delete() {
			this.record("delete");
		}

		id(live: Live) {
			return live.id;
		}

		inputs({ name }: Live) {
			this.record("inputs");
			return { name };
		}
	}

	it("runs each operation as a method, so it can use its own members", async () => {
		const webhook = new Webhook();
		const provider = await configured(webhook);
		const inputs = { name: "a", url: "https://a.example" };

		await provider.create(withProvider(inputs));
		await provider.read("we_1", inputs);
		await provider.update("we_1", { ...inputs, output: live }, withProvider(inputs));
		await provider.delete("we_1", { ...inputs, output: live });

		expect(webhook.calls).toEqual(["create", "read", "inputs", "update", "delete"]);
	});
});

describe("diff", () => {
	const olds = { name: "a", url: "https://a.example", output: live, __provider: "old code" };

	it("ignores a change to the serialized implementation", async () => {
		const provider = await configured(operations());

		const result = await provider.diff("we_1", olds, {
			name: "a",
			url: "https://a.example",
			__provider: "new code",
		});

		expect(result).toEqual({ changes: false, replaces: [] });
	});

	it("updates in place when the resource has an update", async () => {
		const provider = await configured(operations());

		const result = await provider.diff(
			"we_1",
			olds,
			withProvider({ name: "b", url: "https://a.example" }),
		);

		expect(result).toEqual({ changes: true, replaces: [] });
	});

	it("replaces on any change when the resource has no update", async () => {
		const provider = await configured(operations({ update: undefined }));

		const result = await provider.diff(
			"we_1",
			olds,
			withProvider({ name: "b", url: "https://b.example" }),
		);

		expect(result).toEqual({ changes: true, replaces: ["name", "url"] });
	});

	it("replaces when a field in `replaceOnChanges` changes", async () => {
		const provider = await configured(operations({ replaceOnChanges: ["url"] }));

		const result = await provider.diff(
			"we_1",
			olds,
			withProvider({ name: "b", url: "https://b.example" }),
		);

		expect(result).toEqual({ changes: true, replaces: ["url"] });
	});

	it("compares nested values structurally, ignoring key order", async () => {
		const provider = await configured(operations());
		const nested = { name: "a", url: "https://a.example", meta: { x: 1, y: 2 } };

		const result = await provider.diff("we_1", { ...nested, output: live }, {
			...withProvider(nested),
			meta: { y: 2, x: 1 },
		} as never);

		expect(result).toEqual({ changes: false, replaces: [] });
	});
});
