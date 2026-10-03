import type { Api, Body } from "./api.ts";
import type { Operations } from "./resource.ts";

// `"method path"`, or the same written out when a path parameter takes an input of another name.
export type Route =
	| string
	| { method: string; path: string; pathParams?: Record<string, string | undefined> };

export interface Routes {
	create: Route;
	read: Route;
	// Without an update, every change replaces the resource.
	update?: Route;
	delete: Route;
	// The key each response wraps the object in, as Chargebee's `{ webhook_endpoint: … }`.
	model?: string;
	// The inputs a refresh reads back from the live object, to see drift.
	inputs?: Array<string>;
	replaceOnChanges?: Array<string>;
	secretOutputs?: Array<string>;
}

// Path templates are flat `{name}` tokens.
const parameter = /\{([^}]+)\}/gu;

const parametersIn = (path: string) => [...path.matchAll(parameter)].map(([, name]) => name!);

function routeOf(route: Route) {
	if (typeof route !== "string")
		return { method: route.method, path: route.path, pathParams: route.pathParams ?? {} };

	const [method, path] = route.split(" ") as [string, string];
	return { method, path, pathParams: {} as Record<string, string | undefined> };
}

const present = (value: unknown) => value !== undefined && value !== null;

// Each path parameter takes the input of its name, or the one `pathParams` names; the one no input
// fills takes the resource's id.
function parametersFor(
	path: string,
	pathParams: Record<string, string | undefined>,
	inputs: Record<string, unknown>,
	id?: string,
) {
	const names = parametersIn(path);
	const source = (name: string) => pathParams[name] ?? name;
	const unfilled = names.filter((name) => !present(inputs[source(name)]));

	if (id === undefined && unfilled.length > 0)
		throw new Error(`No value for path parameter "${unfilled[0]}" in ${path}.`);
	if (unfilled.length > 1)
		throw new Error(
			`No input fills ${unfilled.map((name) => `{${name}}`).join(" or ")} in ${path}, so either could take the id.`,
		);

	return Object.fromEntries(
		names.map((name) => [name, unfilled.includes(name) ? id : inputs[source(name)]]),
	);
}

async function send(
	api: Api,
	route: Route,
	inputs: Record<string, unknown>,
	{ id, withBody }: { id?: string; withBody: boolean },
) {
	const { method, path, pathParams } = routeOf(route);
	const values = parametersFor(path, pathParams, inputs, id);
	const used = new Set(parametersIn(path).map((name) => pathParams[name] ?? name));

	const body: Body = Object.fromEntries(Object.entries(inputs).filter(([key]) => !used.has(key)));
	const filled = path.replace(parameter, (_, name: string) =>
		encodeURIComponent(String(values[name])),
	);

	return api.request(method.toUpperCase(), filled, withBody ? body : undefined);
}

// A resource's operations from its routes. Its id is the live object's `id`.
export function operationsFor<Inputs, Live>(routes: Routes): Operations<Inputs, Live> {
	const { model, update, inputs } = routes;

	const call = async (
		api: Api,
		route: Route,
		values: Inputs,
		options: { id?: string; withBody: boolean },
	) => {
		const response = await send(api, route, values as Record<string, unknown>, options);

		return (
			model === undefined ? response : (response as Record<string, unknown> | undefined)?.[model]
		) as Live | undefined;
	};

	const written = async (api: Api, route: Route, values: Inputs, id?: string) => {
		const live = await call(api, route, values, { id, withBody: true });
		if (live === undefined)
			throw new Error(`${routeOf(route).path} returned no ${model ?? "object"}.`);
		return live;
	};

	return {
		create: (api, inputs) => written(api, routes.create, inputs),
		read: (api, id, inputs) => call(api, routes.read, inputs, { id, withBody: false }),
		update:
			update === undefined ? undefined : (api, id, inputs) => written(api, update, inputs, id),
		delete: async (api, id, inputs) => {
			await call(api, routes.delete, inputs, { id, withBody: false });
		},
		id: (live) => {
			const { id } = live as { id?: unknown };
			if (!present(id)) throw new Error(`The ${model ?? "created object"} has no id.`);
			return String(id);
		},
		inputs:
			inputs === undefined
				? undefined
				: (live) =>
						Object.fromEntries(
							inputs.map((key) => [key, (live as Record<string, unknown>)[key]]),
						) as Partial<Inputs>,
		replaceOnChanges: routes.replaceOnChanges as Operations<Inputs, Live>["replaceOnChanges"],
		secretOutputs: routes.secretOutputs as Operations<Inputs, Live>["secretOutputs"],
	};
}
