import * as pulumi from "@pulumi/pulumi";

import type { Encoding } from "./api.ts";
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
import { Provider as FetchProvider } from "./provider.ts";
import { define, type ResourceClass } from "./resource.ts";
import { operationsFor, type Routes } from "./routes.ts";

export interface ConnectionConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  encoding?: Encoding;
}

export type Arguments<Args> = { [Key in keyof Args]: pulumi.Input<Args[Key]> };

interface Entry<E extends Endpoints> {
  create: RouteSpec<E>;
  read: RouteSpec<E>;
  update?: RouteSpec<E>;
  delete: RouteSpec<E>;
  model?: string;
}

type ModelKey<Resource> = Resource extends { model: infer Model extends string } ? Model : never;

type CreateOf<Resource extends { create: unknown }> = RouteOf<Resource["create"]>;

// Without endpoint types, any route goes.
export interface Config<
  E extends Endpoints,
  Args extends object,
  Resources extends Record<string, Entry<E>>,
> extends Types<E> {
  // Resources register as `pulumi-nodejs:dynamic/<module>:<key>`.
  module: string;
  // Turns the provider's arguments into its connection.
  provider: (args: Args) => ConnectionConfig;
  resources: Resources & {
    [Name in keyof Resources]: Definition<E, Resources[Name]["create"], ModelKey<Resources[Name]>>;
  };
}

export type ProviderClass<Args> = new (
  name: string,
  args: Arguments<Args>,
  options?: pulumi.ResourceOptions,
) => pulumi.ProviderResource;

export type Defined<
  E extends Endpoints,
  Args extends object,
  Resources extends Record<string, Entry<E>>,
> = { Provider: ProviderClass<Args> } & {
  [Name in keyof Resources]: ResourceClass<
    InputsOf<E, CreateOf<Resources[Name]>>,
    LiveOf<E, CreateOf<Resources[Name]>, ModelKey<Resources[Name]>>
  >;
};

export function defineConfig<
  E extends Endpoints = AnyEndpoints,
  Args extends object = object,
  const Resources extends Record<string, Entry<NoInfer<E>>> = Record<string, Entry<E>>,
>({
  module,
  provider: connect,
  resources,
}: Config<E, Args, Resources>): Defined<E, Args, Resources> {
  class Provider extends FetchProvider {
    constructor(name: string, args: Arguments<Args>, options?: pulumi.ResourceOptions) {
      const connection = pulumi.output(args).apply((args) => connect(args as Args));

      super(
        name,
        {
          baseUrl: connection.baseUrl,
          headers: connection.apply(({ headers }) => headers ?? {}),
          encoding: connection.apply(({ encoding }) => encoding ?? "json"),
        },
        options,
      );
    }
  }

  const classes = Object.fromEntries(
    Object.entries(resources as Record<string, Routes & { secretOutputs?: Array<string> }>).map(
      ([type, { secretOutputs, ...routes }]) => [
        type,
        define<Record<string, unknown>, Record<string, unknown>>({
          module,
          type,
          secretOutputs,
          ...operationsFor(routes),
        }),
      ],
    ),
  );

  return { Provider, ...classes } as Defined<E, Args, Resources>;
}
