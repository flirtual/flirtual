import { api } from "./common";

interface TranslationOptions { text: string; language: string }

export const OpenAI = {
	translate(options: TranslationOptions) {
		return api
			.url("translate")
			.json(options)
			.post()
			.json<{ text: string }>();
	}
};
