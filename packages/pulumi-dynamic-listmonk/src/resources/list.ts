import { type Api, type Body, FetchResource } from "@flirtual/pulumi-dynamic-fetch";

import { request, type Schemas, required } from "../client.ts";

type Fields = Required<Schemas.NewList>;
type Live = Schemas.List;

export type ListInputs = Pick<Fields, "name" | "type" | "optin"> &
	Partial<Pick<Fields, "tags" | "description">>;

// The spec types a stored list's `type` and `optin` as any string; whatever it holds shows up as
// drift against the inputs.
const fields = ({
	name = "",
	type = "private",
	optin = "single",
	tags = [],
	description = "",
}: Partial<Record<keyof Fields, unknown>>): Fields & Body => ({
	name: name as Fields["name"],
	type: type as Fields["type"],
	optin: optin as Fields["optin"],
	tags: tags as Fields["tags"],
	description: description as Fields["description"],
});

// Listmonk answers `GET /lists/{id}` for a missing list with a 400, as it does a bad request
// (listmonk internal/core/lists.go), so find the list among all of them instead. With no lists,
// the minimal listing's `data` is a bare array rather than a page.
export async function allLists(api: Api) {
	const listing = await request<{ results: Array<Live> } | Array<Live>>(
		api,
		"GET",
		"/lists?minimal=true",
	);
	return Array.isArray(listing) ? listing : (listing?.results ?? []);
}

export class ListResource extends FetchResource<ListInputs, Live> {
	async create(api: Api, inputs: ListInputs) {
		return required(
			await request<Live>(api, "POST", "/lists", fields(inputs)),
			`Listmonk didn't return the list "${inputs.name}".`,
		);
	}

	async read(api: Api, id: string) {
		return (await allLists(api)).find((list) => String(list.id) === id);
	}

	async update(api: Api, id: string, inputs: ListInputs) {
		return required(
			await request<Live>(api, "PUT", `/lists/${id}`, fields(inputs)),
			`Listmonk didn't return list ${id}.`,
		);
	}

	async delete(api: Api, id: string) {
		await request(api, "DELETE", `/lists/${id}`);
	}

	id(live: Live) {
		return String(live.id);
	}

	// Only the fields the inputs set, so an unset one isn't drift.
	inputs(live: Live, inputs: ListInputs) {
		return Object.fromEntries(
			Object.entries(fields(live)).filter(([key]) => key in inputs),
		) as Partial<ListInputs>;
	}
}
