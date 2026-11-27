import { useSuspenseQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { countriesOptions, gamesOptions, gendersOptions, interestsOptions, kinksOptions, languagesOptions, platformsOptions, sexualitiesOptions } from "~/api/data";
import type { User } from "~/api/user";
import type {
	AdvancedFilter,
	AdvancedFilterCategory,
	ProfileAdvancedFilters
} from "~/api/user/profile";
import { getCountryName } from "~/components/profile/pill/country";
import { personality, vrTags } from "~/features";
import { useDisplayLocale, useLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";
import { queryClient } from "~/query";

import type { AdvancedFilterGroup, AdvancedFilterOption } from "./advanced-filter-select";

export const maximumAdvancedFilters = 30;

// "Popular" interest-category listed separately.
const popularInterestCategory = "popular";

// Selections are encoded as "<category>:<value>" so a single
// select can hold every category.
export function advancedFiltersToSelections(filters: ProfileAdvancedFilters | undefined) {
	const include: Array<string> = [];
	const exclude: Array<string> = [];

	for (const filter of filters ?? []) {
		if (!filter.value) continue;

		(filter.kind === "include" ? include : exclude).push(`${filter.category}:${filter.value}`);
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

		return { kind, category, value };
	};

	return [
		...include.map(parse("include")),
		...exclude.map(parse("exclude"))
	].filter((filter): filter is AdvancedFilter => !!filter);
}

export function advancedFilterQueries(locale: string) {
	return [
		gendersOptions({ locale }),
		sexualitiesOptions({ locale }),
		interestsOptions({ locale }),
		gamesOptions({ locale }),
		platformsOptions({ locale }),
		kinksOptions({ locale }),
		countriesOptions({ locale }),
		languagesOptions({ locale, order: ["name"] })
	] as const;
}

// Each entry by name: TypeScript can't infer `prefetchQuery` over a list of differently typed options.
export function prefetchAdvancedFilters(locale: string) {
	const [genders, sexualities, interests, games, platforms, kinks, countries, languages] = advancedFilterQueries(locale);

	return Promise.all([
		queryClient.prefetchQuery(genders),
		queryClient.prefetchQuery(sexualities),
		queryClient.prefetchQuery(interests),
		queryClient.prefetchQuery(games),
		queryClient.prefetchQuery(platforms),
		queryClient.prefetchQuery(kinks),
		queryClient.prefetchQuery(countries),
		queryClient.prefetchQuery(languages)
	]);
}

export function useAdvancedFilterGroups(
	{ nsfw }: { nsfw: boolean }
): Array<AdvancedFilterGroup> {
	const { t } = useTranslation();
	const locale = useDisplayLocale();
	const [appLocale] = useLocale();

	const [
		{ data: genders },
		{ data: sexualities },
		{ data: interests },
		{ data: games },
		{ data: platforms },
		{ data: kinks },
		{ data: countries },
		{ data: languages }
	] = useSuspenseQueries({ queries: advancedFilterQueries(appLocale) });

	return useMemo(() => {
		const entryOptions = (
			category: AdvancedFilterCategory,
			collection: ReadonlyArray<{ id: string; name: string }>
		): Array<AdvancedFilterOption> =>
			collection
				.map(({ id, name }) => ({
					key: `${category}:${id}`,
					label: name
				}));

		// Countries are named here, by `Intl`, so only the client can sort them by name.
		const byLabel = (a: AdvancedFilterOption, b: AdvancedFilterOption) =>
			a.label.localeCompare(b.label, intlLocale(locale));

		const groups: Array<AdvancedFilterGroup | null> = [
			{
				key: "gender",
				label: t("genders"),
				premium: false,
				options: entryOptions("gender", genders)
			},
			{
				key: "popular-interest",
				label: t("popular_interests"),
				premium: false,
				options: entryOptions(
					"interest",
					interests.filter(({ category }) => category === popularInterestCategory)
				)
			},
			{
				key: "language",
				label: t("languages"),
				premium: false,
				options: languages
					.map(({ id, name }) => ({
						key: `language:${id}`,
						label: name
					}))
			},
			vrTags
				? {
						key: "headset",
						label: t("vr_platforms"),
						premium: false,
						options: entryOptions(
							"platform",
							platforms.filter(({ kind }) => kind === "headset")
						)
					}
				: null,
			vrTags
				? {
						key: "accessory",
						label: t("vr_accessories"),
						premium: true,
						options: entryOptions(
							"platform",
							platforms.filter(({ kind }) => kind === "accessory")
						)
					}
				: null,
			{
				key: "country",
				label: t("countries"),
				premium: true,
				options: countries
					.map(({ id }) => ({
						key: `country:${id.toLowerCase()}`,
						label: getCountryName(locale, id) ?? id
					}))
					.sort(byLabel)
			},
			{
				key: "sexuality",
				label: t("sexualities"),
				premium: true,
				options: entryOptions("sexuality", sexualities)
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
				key: "interest",
				label: t("interests"),
				premium: true,
				options: entryOptions(
					"interest",
					interests.filter(({ category }) => category !== popularInterestCategory)
				)
			},
			vrTags
				? {
						key: "game",
						label: t("vr_apps_games"),
						premium: true,
						options: entryOptions("game", games)
					}
				: null,
			personality
				? {
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
					}
				: null,
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
						options: entryOptions("kink", kinks)
					}
				: null
		];

		return groups
			.filter((group): group is AdvancedFilterGroup => !!group)
			.filter(({ options }) => options.length > 0);
	}, [genders, sexualities, interests, games, platforms, kinks, countries, languages, nsfw, locale, t]);
}

// The keys of the user's own tags, so the "I only want to see..." list can
// show them first within each category.
export function ownFilterKeys(user: User): Set<string> {
	const { profile } = user;
	const tagKeys = (category: AdvancedFilterCategory, ids: Array<string> | undefined) =>
		(ids ?? []).map((id) => `${category}:${id}`);

	const pole = (value: number | null | undefined, positive: string, negative: string) =>
		!value
			? []
			: [`personality:${value > 0 ? positive : negative}`];

	return new Set([
		...tagKeys("sexuality", profile.sexualities),
		...tagKeys("interest", profile.interests),
		...tagKeys("game", profile.games),
		...tagKeys("platform", profile.platforms),
		...tagKeys("kink", profile.kinks),
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
