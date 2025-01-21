import { api } from "~/api/common";

import type { Profile } from ".";

// eslint-disable-next-line ts/consistent-type-definitions
export type ProfilePersonality = {
	question0: boolean | null;
	question1: boolean | null;
	question2: boolean | null;
	question3: boolean | null;
	question4: boolean | null;
	question5: boolean | null;
	question6: boolean | null;
	question7: boolean | null;
	question8: boolean | null;
};

const personalityQuestionCount = 9;

export const DefaultProfilePersonality = Object.freeze<ProfilePersonality>(
	Object.fromEntries(
		Array.from({ length: personalityQuestionCount }, (_, questionIndex) => [
			`question${questionIndex}`,
			null
		])
	) as unknown as ProfilePersonality
);

export const Personality = {
	get(userId: string) {
		return api
			.url(`users/${userId}/profile/personality`)
			.get()
			.json<ProfilePersonality>();
	},
	update(userId: string, options: ProfilePersonality) {
		return api
			.url(`users/${userId}/profile/personality`)
			.json(options)
			.post()
			.json<Profile>();
	}
};
