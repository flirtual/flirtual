import { type Api, FetchResource, type Outputs } from "@flirtual/pulumi-dynamic-fetch";

import { request, required } from "../client.ts";

interface UserInputs {
	username: string;
	// The id of a Role.
	roleId: string;
}

interface AnsweredUser {
	id: number;
	username: string;
	user_role_id: number;
	// An API user's token, returned only by the request that creates the user.
	password?: string;
}

interface LiveUser {
	id: number;
	username: string;
	user_role_id: number;
	token: string;
}

const body = ({ username, roleId }: UserInputs) => ({
	username,
	name: username,
	type: "api",
	status: "enabled",
	user_role_id: Number(roleId),
});

const live = ({ id, username, user_role_id }: AnsweredUser, token: string): LiveUser => ({
	id,
	username,
	user_role_id,
	token,
});

// An API user. Listmonk generates its token on creation and never shows it again
// (internal/core/users.go in knadh/listmonk), so a lost token means replacing the user.
// /users is missing from the spec (cmd/handlers.go).
export class UserResource extends FetchResource<UserInputs, LiveUser> {
	readonly secretOutputs = ["output" as const];

	async create(api: Api, inputs: UserInputs) {
		const user = await request<AnsweredUser>(api, "POST", "/users", body(inputs));
		if (user?.password === undefined)
			throw new Error(`Listmonk didn't return a token for "${inputs.username}".`);

		return live(user, user.password);
	}

	async read(api: Api, id: string, _inputs: UserInputs, previous?: LiveUser) {
		if (previous === undefined)
			throw new Error(`Listmonk user "${id}" can't be imported; its token is unreadable.`);

		const user = await request<AnsweredUser>(api, "GET", `/users/${id}`);
		return user && live(user, previous.token);
	}

	async update(api: Api, id: string, inputs: UserInputs, olds: Outputs<UserInputs, LiveUser>) {
		const user = required(
			await request<AnsweredUser>(api, "PUT", `/users/${id}`, body(inputs)),
			`Listmonk didn't return user ${id}.`,
		);

		return live(user, olds.output.token);
	}

	async delete(api: Api, id: string) {
		await request(api, "DELETE", `/users/${id}`);
	}

	id(live: LiveUser) {
		return String(live.id);
	}

	inputs({ username, user_role_id }: LiveUser) {
		return { username, roleId: String(user_role_id) };
	}
}
