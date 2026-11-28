import type { I18n } from "emoji-picker-element/shared";

export default {
	categoriesLabel: "Kategorier",
	emojiUnsupportedMessage: "Webbläsaren har inte stöd för färgemojier.",
	favoritesLabel: "Favoriter",
	loadingMessage: "Läser in…",
	networkErrorMessage: "Det gick inte att läsa in emojier.",
	regionLabel: "Emojiväljare",
	searchDescription: "När sökresultat visas väljer du med uppåt- eller nedåtpil och bekräftar med Enter.",
	searchLabel: "Sök",
	searchResultsLabel: "Sökresultat",
	skinToneDescription: "När menyn är öppen väljer du med uppåt- eller nedåtpil och bekräftar med Enter.",
	skinToneLabel: "Välj hudton (nu: {skinTone})",
	skinTonesLabel: "Hudtoner",
	skinTones: [
		"Standard",
		"Ljus",
		"Mellanljus",
		"Mellan",
		"Mellanmörk",
		"Mörk"
	],
	categories: {
		custom: "Anpassade",
		"smileys-emotion": "Smileys och känslor",
		"people-body": "Människor och kropp",
		"animals-nature": "Djur och natur",
		"food-drink": "Mat och dryck",
		"travel-places": "Resor och platser",
		activities: "Aktiviteter",
		objects: "Objekt",
		symbols: "Symboler",
		flags: "Flaggor"
	}
} satisfies I18n;
