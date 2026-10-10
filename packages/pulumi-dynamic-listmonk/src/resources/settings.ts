import { type Api, FetchResource } from "@flirtual/pulumi-dynamic-fetch";

import { request, required } from "../client.ts";

type Values = Record<string, unknown>;

const isObject = (value: unknown): value is Values =>
	value !== null && typeof value === "object" && !Array.isArray(value);

// Listmonk returns secrets masked as "•••", and keeps the stored secret only when sent an empty one.
const masked = (value: unknown) => typeof value === "string" && /^•+$/u.test(value);

function unmask(value: unknown): unknown {
	if (masked(value)) return "";
	if (Array.isArray(value)) return value.map(unmask);
	if (isObject(value))
		return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, unmask(value)]));
	return value;
}

// The given values over Listmonk's: objects key by key, arrays item by item with the given array
// deciding the length. What isn't given keeps Listmonk's value, such as a field a newer version adds.
function overlay(current: unknown, given: unknown): unknown {
	if (Array.isArray(given))
		return given.map((item, index) =>
			overlay(Array.isArray(current) ? current[index] : undefined, item),
		);
	if (isObject(given)) {
		const base = isObject(current) ? current : {};
		return {
			...(unmask(base) as Values),
			...Object.fromEntries(
				Object.entries(given).map(([key, value]) => [key, overlay(base[key], value)]),
			),
		};
	}
	return given;
}

// Listmonk's values cut down to the paths given, so a field it adds isn't drift. Array items past
// the given ones stay whole, so an extra one is. A masked secret reads back as the value given.
function project(live: unknown, given: unknown): unknown {
	if (masked(live)) return given;
	if (Array.isArray(live))
		return live.map((item, index) =>
			Array.isArray(given) && index < given.length ? project(item, given[index]) : item,
		);
	if (isObject(live) && isObject(given))
		return Object.fromEntries(
			Object.keys(given).map((key) => [key, project(live[key], given[key])]),
		);
	return live;
}

const current = async (api: Api) =>
	required(await request<Values>(api, "GET", "/settings"), "Listmonk returned no settings.");

// Settings Listmonk leaves out of GET /settings while they're empty (`omitempty` in listmonk
// models/settings.go).
const omittedWhenEmpty = ["upload.s3.aws_secret_access_key"];

// The spec's Settings schema predates keys Listmonk has had since v3 (`bounce.actions`,
// `privacy.record_optin_ip`), so settings go by the running instance's keys instead.
async function apply(api: Api, values: Values) {
	// A PUT replaces every setting, so start from the current ones.
	const settings = await current(api);

	const unknown = Object.keys(values).filter(
		(key) => !(key in settings) && !omittedWhenEmpty.includes(key),
	);
	if (unknown.length > 0) throw new Error(`Listmonk has no settings named ${unknown.join(", ")}.`);

	await request(api, "PUT", "/settings", overlay(settings, values) as Values);

	return values;
}

// Keyed as GET /api/settings keys them (`app.root_url`, `smtp`, …). Unlisted settings are kept.
export class SettingsResource extends FetchResource<Values, Values> {
	readonly secretOutputs = ["output" as const];

	create(api: Api, inputs: Values) {
		return apply(api, inputs);
	}

	update(api: Api, _id: string, inputs: Values) {
		return apply(api, inputs);
	}

	async read(api: Api, _id: string, inputs: Values) {
		const keys = Object.keys(inputs);
		if (keys.length === 0)
			throw new Error("Listmonk settings can't be imported; secrets are unreadable.");

		const live = await current(api);
		return Object.fromEntries(keys.map((key) => [key, project(live[key], inputs[key])]));
	}

	// Listmonk always has settings; leaving them is all a delete can do.
	async delete() {}

	id() {
		return "settings";
	}

	inputs(live: Values) {
		return live;
	}
}
