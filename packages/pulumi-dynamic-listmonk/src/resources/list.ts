import { type Api, type Body, FetchResource } from "@flirtual/pulumi-dynamic-fetch";

import { request, type Schemas, required } from "../client.ts";

type Fields = Required<Schemas.NewList>;
type Live = Schemas.List;

export interface ListInputs
	extends Pick<Fields, "name" | "type" | "optin">, Partial<Pick<Fields, "tags" | "description">> {
	// Takes over this list if it exists, and fails rather than create the list under another id.
	listId?: number;
}

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
export async function findList(api: Api, id: number | string) {
	const listing = await request<{ results: Array<Live> } | Array<Live>>(
		api,
		"GET",
		"/lists?minimal=true",
	);
	const lists = Array.isArray(listing) ? listing : (listing?.results ?? []);

	return lists.find((list) => String(list.id) === String(id));
}

async function takeOver(api: Api, inputs: ListInputs) {
	const { listId } = inputs;
	if (listId === undefined) return undefined;
	if (!(await findList(api, listId))) return undefined;

	return request<Live>(api, "PUT", `/lists/${listId}`, fields(inputs));
}

export class ListResource extends FetchResource<ListInputs, Live> {
	readonly replaceOnChanges = ["listId" as const];

	async create(api: Api, inputs: ListInputs) {
		const taken = await takeOver(api, inputs);
		if (taken) return taken;

		// Listmonk numbers lists itself, so a missing list only gets the id asked for when it's next.
		const created = required(
			await request<Live>(api, "POST", "/lists", fields(inputs)),
			`Listmonk didn't return the list "${inputs.name}".`,
		);
		if (inputs.listId !== undefined && created.id !== inputs.listId)
			throw new Error(
				`Listmonk created "${inputs.name}" as list ${created.id}, not ${inputs.listId}.`,
			);

		return created;
	}

	read(api: Api, id: string) {
		return findList(api, id);
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
		const read: Partial<ListInputs> = { listId: live.id, ...fields(live) };
		return Object.fromEntries(
			Object.entries(read).filter(([key]) => key in inputs),
		) as Partial<ListInputs>;
	}
}
