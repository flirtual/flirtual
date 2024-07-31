import { fetch, type NarrowFetchOptions } from "../../exports";

import type { Attribute } from "~/api/attributes";

export interface ProfilePrompt {
	prompt: Attribute;
	response: string;
}

export type ProfilePromptList = Array<ProfilePrompt>;

export type UpdateProfilePrompt = Array<{ promptId: string; response: string }>;

export async function update(
	userId: string,
	options: NarrowFetchOptions<UpdateProfilePrompt>
) {
	return fetch<ProfilePromptList>(
		"post",
		`users/${userId}/profile/prompts`,
		options
	);
}
