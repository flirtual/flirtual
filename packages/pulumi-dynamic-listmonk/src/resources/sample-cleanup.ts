import { type Api, FetchResource } from "@flirtual/pulumi-dynamic-fetch";

import { request, type Schemas } from "../client.ts";
import { allLists } from "./list.ts";

// What `listmonk --install` seeds besides the templates. The example subscribers sit on the
// default list, so a newsletter would otherwise mail example.com and bounce.
const seededLists = [
	{ id: 1, name: "Default list" },
	{ id: 2, name: "Opt-in list" },
];
const subscribers = ["john@example.com", "anon@example.com"];

type Nothing = Record<string, never>;

export class SampleCleanupResource extends FetchResource<Nothing, Nothing> {
	async create(api: Api) {
		const lists = await allLists(api);
		for (const seeded of seededLists)
			if (lists.some(({ id, name }) => id === seeded.id && name === seeded.name))
				await request(api, "DELETE", `/lists/${seeded.id}`);

		const query = `subscribers.email in (${subscribers.map((email) => `'${email}'`).join(", ")})`;
		const found = await request<{ results?: Array<Schemas.Subscriber> }>(
			api,
			"GET",
			`/subscribers?${new URLSearchParams({ per_page: "all", query })}`,
		);

		for (const { id } of found?.results ?? [])
			if (id !== undefined) await request(api, "DELETE", `/subscribers/${id}`);

		return {};
	}

	// Nothing remains to read, and it must not read as gone.
	async read() {
		return {};
	}

	// Nothing to put back.
	async delete() {}

	id() {
		return "sample-cleanup";
	}
}
