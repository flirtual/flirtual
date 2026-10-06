import * as pulumi from "@pulumi/pulumi";

import type {
	AnyEndpoints,
	Definition,
	Endpoints,
	InputsOf,
	LiveOf,
	RouteOf,
	RouteSpec,
	Types,
} from "./endpoints.ts";
import { Provider as FetchProvider, type ProviderArgs } from "./provider.ts";
import { type Authenticate, define, type FetchResource, type ResourceClass } from "./resource.ts";
import { type Route as AnyRoute, operationsFor, type Routes } from "./routes.ts";

interface Entry<E extends Endpoints> {
	create: RouteSpec<E>;
	read: RouteSpec<E>;
	update?: RouteSpec<E>;
	delete: RouteSpec<E>;
	model?: string;
}

// A FetchResource subclass, for a resource that takes more than routes.
type ResourceConstructor = new () => FetchResource<any, any>;

type ModelKey<Resource> = Resource extends { model: infer Model extends string } ? Model : never;

type CreateOf<Resource extends { create: unknown }> = RouteOf<Resource["create"]>;

// Routes are checked against the endpoints; a class is checked by its own types.
type Checked<E extends Endpoints, Resource> = Resource extends ResourceConstructor
	? Resource
	: Resource extends { create: infer Create extends AnyRoute }
		? Definition<E, Create, ModelKey<Resource>>
		: never;

type ResourceOf<E extends Endpoints, Resource> = Resource extends ResourceConstructor
	? InstanceType<Resource> extends FetchResource<infer Inputs, infer Live>
		? ResourceClass<Inputs, Live>
		: never
	: Resource extends { create: unknown }
		? ResourceClass<
				InputsOf<E, CreateOf<Resource>>,
				LiveOf<E, CreateOf<Resource>, ModelKey<Resource>>
			>
		: never;

// Without endpoint types, any route goes.
export interface Config<
	E extends Endpoints,
	Args extends object,
	Resources extends Record<string, Entry<E> | ResourceConstructor>,
> extends Types<E> {
	// Resources register as `pulumi-nodejs:dynamic/<module>:<key>`.
	module: string;
	// Turns the provider's arguments, as given, into its connection. Arguments with defaults (an
	// environment variable, a secret config) make them optional, and let a resource without a
	// provider get one.
	provider: (args: Args, options: ProviderOptions) => ProviderArgs;
	// Trades the provider's `credentials` for headers, as an API that only takes a login session needs.
	authenticate?: Authenticate;
	resources: Resources & { [Name in keyof Resources]: Checked<E, Resources[Name]> };
}

export interface ProviderOptions {
	// The config named after the module, as `revenuecat:token`.
	config: pulumi.Config;
}

export type ProviderClass<Args> = new (
	name: string,
	...rest: {} extends Args
		? [args?: Args, options?: pulumi.ResourceOptions]
		: [args: Args, options?: pulumi.ResourceOptions]
) => pulumi.ProviderResource;

export type Defined<
	E extends Endpoints,
	Args extends object,
	Resources extends Record<string, Entry<E> | ResourceConstructor>,
> = { Provider: ProviderClass<Args> } & {
	[Name in keyof Resources]: ResourceOf<E, Resources[Name]>;
};

export function defineConfig<
	E extends Endpoints = AnyEndpoints,
	Args extends object = object,
	const Resources extends Record<string, Entry<NoInfer<E>> | ResourceConstructor> = Record<
		string,
		Entry<E>
	>,
>({
	module,
	provider: connect,
	authenticate,
	resources,
}: Config<E, Args, Resources>): Defined<E, Args, Resources> {
	class Provider extends FetchProvider {
		constructor(name: string, args?: Args, options?: pulumi.ResourceOptions) {
			super(name, connect(args ?? ({} as Args), { config: new pulumi.Config(module) }), options);
		}
	}

	let fallback: Provider | undefined;

	// Every config's provider has the same Pulumi type, so only this check keeps another config's
	// connection, and its credentials, away from these resources.
	function providerFor(type: string, name: string, provider?: pulumi.ProviderResource) {
		if (provider === undefined) return (fallback ??= new Provider(`default_${module}`));
		if (!(provider instanceof Provider))
			throw new Error(`${module}:${type} "${name}" needs a provider from the ${module} config.`);

		return provider;
	}

	function resourceClass(type: string, resource: Routes | ResourceConstructor) {
		const Resource = define(
			module,
			type,
			typeof resource === "function"
				? new resource()
				: operationsFor<Record<string, unknown>, Record<string, unknown>>(resource),
			authenticate,
		);

		return class extends Resource {
			constructor(
				name: string,
				args: Record<string, pulumi.Input<unknown>>,
				options?: pulumi.CustomResourceOptions,
			) {
				super(name, args, { ...options, provider: providerFor(type, name, options?.provider) });
			}
		};
	}

	const classes = Object.fromEntries(
		Object.entries(resources as Record<string, Routes | ResourceConstructor>).map(
			([type, resource]) => [type, resourceClass(type, resource)],
		),
	);

	return { Provider, ...classes } as Defined<E, Args, Resources>;
}
