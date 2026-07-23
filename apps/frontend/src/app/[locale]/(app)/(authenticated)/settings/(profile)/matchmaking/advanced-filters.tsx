import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { User } from "~/api/user";
import type {
	AdvancedFilter,
	AdvancedFilterCategory,
	ProfileAdvancedFilters
} from "~/api/user/profile";
import { advancedFilterValueCategories } from "~/api/user/profile";
import { getCountryName } from "~/components/profile/pill/country";
import { useAttributes, useAttributeTranslation } from "~/hooks/use-attribute";
import { useLocale } from "~/i18n";

import type { AdvancedFilterGroup, AdvancedFilterOption } from "./advanced-filter-select";

export const maximumAdvancedFilters = 25;

// "Popular" interest-category listed separately.
const popularInterestCategory = "iiCe39JvGQAAtsrTqnLddb";

// Selections are encoded as "<category>:<attribute id or value>" so a single
// select can hold every category.
export function advancedFiltersToSelections(filters: ProfileAdvancedFilters | undefined) {
	const include: Array<string> = [];
	const exclude: Array<string> = [];

	for (const filter of filters ?? []) {
		const value = filter.attributeId ?? filter.value;
		if (!value) continue;

		(filter.kind === "include" ? include : exclude).push(`${filter.category}:${value}`);
	}

	return { include, exclude };
}

export function selectionsToAdvancedFilters(
	include: Array<string>,
	exclude: Array<string>
): ProfileAdvancedFilters {
	const parse = (kind: "exclude" | "include") => (selection: string): AdvancedFilter | null => {
		const separator = selection.indexOf(":");
		if (separator === -1) return null;

		const category = selection.slice(0, separator) as AdvancedFilterCategory;
		const value = selection.slice(separator + 1);

		return (advancedFilterValueCategories as ReadonlyArray<string>).includes(category)
			? { kind, category, value }
			: { kind, category, attributeId: value };
	};

	return [
		...include.map(parse("include")),
		...exclude.map(parse("exclude"))
	].filter((filter): filter is AdvancedFilter => !!filter);
}

interface AttributeLike {
	id: string;
	category?: string;
	kind?: string;
}

function normalize(attribute: unknown): AttributeLike {
	return typeof attribute === "string"
		? { id: attribute }
		: (attribute as AttributeLike);
}

export function useAdvancedFilterGroups(
	{ nsfw }: { nsfw: boolean }
): Array<AdvancedFilterGroup> {
	const { t } = useTranslation();
	const tAttribute = useAttributeTranslation();
	const [locale] = useLocale();

	const genders = useAttributes("gender");
	const sexualities = useAttributes("sexuality");
	const interests = useAttributes("interest");
	const games = useAttributes("game");
	const platforms = useAttributes("platform");
	const kinks = useAttributes("kink");
	const countries = useAttributes("country");
	const languages = useAttributes("language");

	return useMemo(() => {
		const languageNames = new Intl.DisplayNames(locale, { type: "language" });

		const attributeOptions = (
			category: AdvancedFilterCategory,
			collection: ReadonlyArray<unknown>
		): Array<AdvancedFilterOption> =>
			collection
				.map(normalize)
				.map(({ id }) => ({
					key: `${category}:${id}`,
					label: tAttribute[id]?.name ?? id
				}));

		const allInterests = interests.map(normalize);
		const allPlatforms = platforms.map(normalize);

		// Country/language are static lists with no `order`, so sort by name.
		const byLabel = (a: AdvancedFilterOption, b: AdvancedFilterOption) =>
			a.label.localeCompare(b.label, locale);

		const groups: Array<AdvancedFilterGroup | null> = [
			{
				key: "headset",
				label: t("vr_platforms"),
				premium: false,
				options: attributeOptions(
					"platform",
					allPlatforms.filter(({ kind }) => kind === "headset")
				)
			},
			{
				key: "accessory",
				label: t("vr_accessories"),
				premium: true,
				options: attributeOptions(
					"platform",
					allPlatforms.filter(({ kind }) => kind === "accessory")
				)
			},
			{
				key: "language",
				label: t("languages"),
				premium: false,
				options: languages
					.map((languageId) => ({
						key: `language:${languageId}`,
						label: tAttribute[languageId]?.name
							?? languageNames.of(languageId)
							?? languageId
					}))
					.sort(byLabel)
			},
			{
				key: "country",
				label: t("countries"),
				premium: true,
				options: countries
					.map((countryId) => ({
						key: `country:${countryId.toLowerCase()}`,
						label: getCountryName(locale, countryId) ?? countryId
					}))
					.sort(byLabel)
			},
			{
				key: "gender",
				label: t("genders"),
				premium: false,
				options: attributeOptions("gender", genders)
			},
			{
				key: "sexuality",
				label: t("sexualities"),
				premium: true,
				options: attributeOptions("sexuality", sexualities)
			},
			{
				key: "relationships",
				label: t("looking_for"),
				premium: true,
				options: [
					{ key: "relationships:serious", label: t("serious_dating") },
					{ key: "relationships:vr", label: t("casual_dating") },
					{ key: "relationships:hookups", label: t("hookups") },
					{ key: "relationships:friends", label: t("new_friends") }
				]
			},
			{
				key: "monopoly",
				label: t("relationship_type"),
				premium: true,
				options: [
					{ key: "monopoly:monogamous", label: t("monogamous") },
					{ key: "monopoly:nonmonogamous", label: t("nonmonogamous") }
				]
			},
			{
				key: "popular-interest",
				label: t("popular_interests"),
				premium: false,
				options: attributeOptions(
					"interest",
					allInterests.filter(({ category }) => category === popularInterestCategory)
				)
			},
			{
				key: "interest",
				label: t("interests"),
				premium: true,
				options: attributeOptions(
					"interest",
					allInterests.filter(({ category }) => category !== popularInterestCategory)
				)
			},
			{
				key: "game",
				label: t("vr_apps_games"),
				premium: true,
				options: attributeOptions("game", games)
			},
			{
				key: "personality",
				label: t("personality"),
				premium: true,
				options: [
					{ key: "personality:openminded", label: t("personality_openminded") },
					{ key: "personality:practical", label: t("personality_practical") },
					{ key: "personality:reliable", label: t("personality_reliable") },
					{ key: "personality:freespirited", label: t("personality_freespirited") },
					{ key: "personality:friendly", label: t("personality_friendly") },
					{ key: "personality:straightforward", label: t("personality_straightforward") }
				]
			},
			nsfw
				? {
						key: "domsub",
						label: t("role"),
						premium: true,
						options: [
							{ key: "domsub:dominant", label: t("dominant") },
							{ key: "domsub:submissive", label: t("submissive") },
							{ key: "domsub:switch", label: t("switch") }
						]
					}
				: null,
			nsfw
				? {
						key: "kink",
						label: t("kinks"),
						premium: true,
						options: attributeOptions("kink", kinks)
					}
				: null
		];

		return groups
			.filter((group): group is AdvancedFilterGroup => !!group)
			.filter(({ options }) => options.length > 0);
	}, [genders, sexualities, interests, games, platforms, kinks, countries, languages, nsfw, tAttribute, locale, t]);
}

// The keys of the user's own tags, so the "I only want to see..." list can
// show them first within each category.
export function ownFilterKeys(user: User): Set<string> {
	const { profile } = user;
	const attribute = (category: AdvancedFilterCategory, ids: Array<string> | undefined) =>
		(ids ?? []).map((id) => `${category}:${id}`);

	const pole = (value: number | undefined, positive: string, negative: string) =>
		value === undefined || value === 0
			? []
			: [`personality:${value > 0 ? positive : negative}`];

	return new Set([
		...attribute("sexuality", profile.attributes.sexuality),
		...attribute("interest", profile.attributes.interest),
		...attribute("game", profile.attributes.game),
		...attribute("platform", profile.attributes.platform),
		...attribute("kink", profile.attributes.kink),
		...(profile.languages ?? []).map((language) => `language:${language}`),
		...(profile.country ? [`country:${profile.country.toLowerCase()}`] : []),
		...(profile.relationships ?? []).map((value) => `relationships:${value}`),
		...(profile.monopoly ? [`monopoly:${profile.monopoly}`] : []),
		...(profile.domsub ? [`domsub:${profile.domsub}`] : []),
		...pole(profile.openness, "openminded", "practical"),
		...pole(profile.conscientiousness, "reliable", "freespirited"),
		...pole(profile.agreeableness, "friendly", "straightforward")
	]);
}

// Reorders each group's options so the user's own tags come first, except in
// the accessory and gender categories.
export function withOwnTagsFirst(
	groups: Array<AdvancedFilterGroup>,
	ownKeys: Set<string>
): Array<AdvancedFilterGroup> {
	return groups.map((group) => {
		if (group.key === "accessory" || group.key === "gender" || ownKeys.size === 0)
			return group;

		const own = group.options.filter(({ key }) => ownKeys.has(key));
		if (own.length === 0) return group;

		const rest = group.options.filter(({ key }) => !ownKeys.has(key));
		return { ...group, options: [...own, ...rest] };
	});
}
