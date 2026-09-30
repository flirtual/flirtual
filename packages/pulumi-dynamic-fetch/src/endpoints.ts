import type { Route as AnyRoute } from "./routes.ts";

type Method = "get" | "put" | "post" | "patch" | "delete" | "head" | "options" | "trace";

// A description of an HTTP API: each method's paths, with their parameters and responses by status.
// typed-openapi's `EndpointByMethod` has this shape.
export type Endpoints = {
  [Verb in Method]?: {
    [path: string]: {
      // Also `header`, `query` and the like, which resources don't use.
      parameters?: { path?: object; body?: object; [location: string]: unknown };
      responses: object;
    };
  };
};

// What an API with no description allows: any route, any inputs, any live object.
export type AnyEndpoints = {
  [Verb in Method]: {
    [path: string]: {
      parameters: { path: Record<string, unknown>; body: Record<string, unknown> };
      responses: { 200: Record<string, unknown> };
    };
  };
};

// Carries an API's endpoint types into `defineConfig`, spread as `...types<EndpointByMethod>()`;
// the value itself holds nothing.
export interface Types<E extends Endpoints> {
  readonly endpoints?: E;
}

export const types = <E extends Endpoints>(): Types<E> => ({});

// Every `"method path"` the API has.
export type Route<E extends Endpoints> = {
  [Verb in keyof E & Method]: `${Verb} ${keyof E[Verb] & string}`;
}[keyof E & Method];

type EndpointAt<E, R> = R extends `${infer Verb} ${infer Path}`
  ? Verb extends keyof E
    ? Path extends keyof NonNullable<E[Verb]>
      ? NonNullable<E[Verb]>[Path]
      : never
    : never
  : never;

type ParametersOf<Endpoint> = Endpoint extends { parameters?: infer Parameters }
  ? NonNullable<Parameters>
  : {};

type ParameterOf<Endpoint, Location extends string> = Location extends keyof ParametersOf<Endpoint>
  ? NonNullable<ParametersOf<Endpoint>[Location]>
  : {};

type SuccessOf<Endpoint> = Endpoint extends { responses: infer Responses }
  ? Responses[Extract<keyof Responses, 200 | 201 | 202 | 203>]
  : never;

// A resource's inputs are its create body plus the create route's path parameters.
export type InputsOf<E, Create> = ParameterOf<EndpointAt<E, Create>, "body"> &
  ParameterOf<EndpointAt<E, Create>, "path">;

type ResponseOf<E, Create> = SuccessOf<EndpointAt<E, Create>>;

export type ModelOf<E, Create> = keyof ResponseOf<E, Create> & string;

// The object a resource manages: the response, or the key it's wrapped in, as Chargebee's
// `{ webhook_endpoint: … }`.
export type LiveOf<E, Create, Model> = [Model] extends [never]
  ? ResponseOf<E, Create>
  : ResponseOf<E, Create>[Model & keyof ResponseOf<E, Create>];

type ParametersIn<Path> = Path extends `${string}{${infer Name}}${infer Rest}`
  ? Name | ParametersIn<Rest>
  : never;

// A route written out, for when a path parameter takes an input of another name.
export type RouteObject<E extends Endpoints, Keys extends string = string> = {
  [Verb in keyof E & Method]: {
    [Path in keyof NonNullable<E[Verb]> & string]: {
      method: Verb;
      path: Path;
      pathParams?: Partial<Record<ParametersIn<Path>, Keys>>;
    };
  }[keyof NonNullable<E[Verb]> & string];
}[keyof E & Method];

// `"method path"`, or the same written out.
export type RouteSpec<E extends Endpoints, Keys extends string = string> =
  | Route<E>
  | RouteObject<E, Keys>;

export type RouteOf<Spec> = Spec extends string
  ? Spec
  : Spec extends { method: infer Verb extends string; path: infer Path extends string }
    ? `${Verb} ${Path}`
    : never;

// A wrong model can't be a literal type: it would meet the one written in the intersection
// `defineConfig` checks, reduce the entry to `never` and fail every other line with it.
interface NotAModel<Models> {
  readonly expected: Models;
}

type KeysOf<E, Create> = keyof InputsOf<E, RouteOf<Create>> & string;

// A resource's routes, typed from its API. Each path parameter takes the input of its name, or the
// one `pathParams` names; the one no input fills takes the resource's id, the live object's `id`.
// `Create` is checked against `RouteSpec<E>` where it's inferred.
export interface Definition<
  E extends Endpoints,
  Create extends AnyRoute,
  Model extends string = never,
> {
  create: Create;
  read: RouteSpec<E, KeysOf<E, Create>>;
  // Without an update, every change replaces the resource.
  update?: RouteSpec<E, KeysOf<E, Create>>;
  delete: RouteSpec<E, KeysOf<E, Create>>;
  model?: Model extends ModelOf<E, RouteOf<Create>>
    ? Model
    : NotAModel<ModelOf<E, RouteOf<Create>>>;
  // The inputs a refresh reads back from the live object, to see drift.
  inputs?: Array<keyof LiveOf<E, RouteOf<Create>, Model> & KeysOf<E, Create>>;
  replaceOnChanges?: Array<KeysOf<E, Create>>;
  secretOutputs?: Array<KeysOf<E, Create> | "output">;
}
