import * as pulumi from "@pulumi/pulumi";

import { Api } from "./api.ts";
import { connectionFrom } from "./provider.ts";

export type Outputs<Inputs, Live> = Inputs & { output: Live };

// pulumi.dynamic.Resource keeps its serialized implementation among the inputs, as `__provider`.
type Serialized<Inputs> = Inputs & { __provider?: string };

export interface Operations<Inputs, Live> {
	create: (api: Api, inputs: Inputs) => Promise<Live>;
	// Resolves to undefined when the resource no longer exists. `previous` is the live object stored
	// before, for values an API returns only on create.
	read: (api: Api, id: string, inputs: Inputs, previous?: Live) => Promise<Live | undefined>;
	// Without an update, every change replaces the resource.
	update?: (api: Api, id: string, inputs: Inputs, olds: Outputs<Inputs, Live>) => Promise<Live>;
	delete: (api: Api, id: string, inputs: Inputs) => Promise<void>;
	id: (live: Live) => string;
	// Maps the live resource back onto inputs, so a refresh can see drift. `inputs` are the stored
	// ones, for what the live object can't tell apart, such as the order of a set.
	inputs?: (live: Live, inputs: Inputs) => Partial<Inputs>;
	replaceOnChanges?: Array<keyof Inputs & string>;
	secretOutputs?: Array<(keyof Inputs & string) | "output">;
}

// A resource whose operations take more than routes; `defineConfig` takes the class as it takes
// routes. Its methods are called on one instance, so they can share its members.
export abstract class FetchResource<Inputs, Live> implements Operations<Inputs, Live> {
	abstract create(api: Api, inputs: Inputs): Promise<Live>;
	abstract read(api: Api, id: string, inputs: Inputs, previous?: Live): Promise<Live | undefined>;
	update?(api: Api, id: string, inputs: Inputs, olds: Outputs<Inputs, Live>): Promise<Live>;
	abstract delete(api: Api, id: string, inputs: Inputs): Promise<void>;
	abstract id(live: Live): string;
	inputs?(live: Live, inputs: Inputs): Partial<Inputs>;
	readonly replaceOnChanges?: Array<keyof Inputs & string>;
	readonly secretOutputs?: Array<(keyof Inputs & string) | "output">;
}

// An array, not a Set: the provider is serialized with its captured values, and Pulumi's closure
// serializer rebuilds a Set as a plain object that `Set.prototype.has` rejects.
const reserved = ["__provider", "output"];

function inputsOf<Inputs>(props: object): Inputs {
	return Object.fromEntries(
		Object.entries(props).filter(([key]) => !reserved.includes(key)),
	) as Inputs;
}

function stable(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
	if (value !== null && typeof value === "object")
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`)
			.join(",")}}`;

	return JSON.stringify(value);
}

class FetchProvider<Inputs extends object, Live> implements pulumi.dynamic.ResourceProvider<
	Inputs,
	Outputs<Inputs, Live>
> {
	declare private api: Api;

	private readonly operations: Operations<Inputs, Live>;

	constructor(operations: Operations<Inputs, Live>) {
		this.operations = operations;
	}

	async configure({ config }: pulumi.dynamic.ConfigureRequest) {
		this.api = new Api(connectionFrom(config));
	}

	async diff(_id: string, olds: Serialized<Outputs<Inputs, Live>>, news: Serialized<Inputs>) {
		const before = inputsOf<Record<string, unknown>>(olds);
		const after = inputsOf<Record<string, unknown>>(news);

		const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])]
			.sort()
			.filter((key) => stable(before[key]) !== stable(after[key]));

		const { update, replaceOnChanges = [] } = this.operations;
		const replaces = update
			? changed.filter((key) => (replaceOnChanges as Array<string>).includes(key))
			: changed;

		return { changes: changed.length > 0, replaces };
	}

	async create(news: Serialized<Inputs>) {
		const inputs = inputsOf<Inputs>(news);
		const live = await this.operations.create(this.api, inputs);

		return { id: this.operations.id(live), outs: { ...inputs, output: live } };
	}

	// `props` is absent on import, and holds only inputs until the first read.
	async read(id: string, props?: Inputs | Outputs<Inputs, Live>) {
		const inputs = inputsOf<Inputs>(props ?? {});
		const previous = props && "output" in props ? props.output : undefined;
		const live = await this.operations.read(this.api, id, inputs, previous);
		if (live === undefined) return {};

		return { id, props: { ...inputs, ...this.operations.inputs?.(live, inputs), output: live } };
	}

	async update(id: string, olds: Outputs<Inputs, Live>, news: Serialized<Inputs>) {
		if (!this.operations.update)
			throw new Error(`Resource ${id} has no update; it should have been replaced.`);

		const inputs = inputsOf<Inputs>(news);
		const live = await this.operations.update(this.api, id, inputs, olds);

		return { outs: { ...inputs, output: live } };
	}

	async delete(id: string, olds: Outputs<Inputs, Live>) {
		await this.operations.delete(this.api, id, inputsOf<Inputs>(olds));
	}
}

export function createProvider<Inputs extends object, Live>(operations: Operations<Inputs, Live>) {
	return new FetchProvider(operations);
}

export type Args<Inputs> = { [Key in keyof Inputs]: pulumi.Input<Inputs[Key]> };

// The live object's fields, each an Output. `id` and `urn` stay the resource's own.
export type LiveFields<Live> = {
	readonly [Key in Exclude<keyof Live, "id" | "urn">]: pulumi.Output<Live[Key]>;
};

export type ResourceClass<Inputs, Live> = new (
	name: string,
	args: Args<Inputs>,
	options?: pulumi.CustomResourceOptions,
) => pulumi.dynamic.Resource & { readonly output: pulumi.Output<Live> } & LiveFields<Live>;

// Names that promises, JSON and Pulumi's own checks probe for; they must stay undefined.
const untouched = new Set(["then", "toJSON", "constructor", "valueOf", "toString"]);

const isLiveField = (target: object, key: string | symbol): key is string =>
	typeof key === "string" && !key.startsWith("__") && !untouched.has(key) && !(key in target);

// The resource's type token is `pulumi-nodejs:dynamic/<module>:<type>`.
export function define<Inputs extends object, Live>(
	module: string,
	type: string,
	operations: Operations<Inputs, Live>,
): ResourceClass<Inputs, Live> {
	const provider = createProvider(operations);
	const { secretOutputs = [] } = operations;

	return class extends pulumi.dynamic.Resource {
		declare readonly output: pulumi.Output<Live>;

		constructor(name: string, args: Args<Inputs>, options?: pulumi.CustomResourceOptions) {
			super(
				provider,
				name,
				{ ...args, output: undefined },
				{
					...options,
					additionalSecretOutputs: [...(options?.additionalSecretOutputs ?? []), ...secretOutputs],
				},
				module,
				type,
			);

			// Any other field reads from the live object, so `webhook.url` is an Output<string>.
			return new Proxy(this, {
				get: (target, key, receiver) =>
					isLiveField(target, key)
						? target.output.apply((live) => (live as Record<string, unknown>)[key])
						: Reflect.get(target, key, receiver),
			});
		}
	} as ResourceClass<Inputs, Live>;
}
