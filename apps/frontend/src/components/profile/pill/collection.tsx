import { queryOptions, useSuspenseQueries } from "@tanstack/react-query";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { byId, gamesOptions, interestsOptions, kinksOptions, languagesOptions, platformsOptions, relationshipsOptions, sexualitiesOptions } from "~/api/data";
import type { User } from "~/api/user";
import { customInterests, personality, playlists, vrTags } from "~/features";
import { useGameStoreLinks, useSessionGameStores } from "~/hooks/use-game-stores";
import { useOptionalSession } from "~/hooks/use-session";
import { useLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";
import { urls } from "~/urls";

import { ProfilePlaylist } from "../playlist";
import { PillEntryList } from "./entry-list";
import { Pill } from "./pill";
import { PillRows } from "./rows";

function isDomsubMatch(value1: string | undefined, value2: string | undefined) {
	const a = new Set([value1, value2]);
	return (
		(value1 === "switch" && value2 === "switch")
		|| (a.has("dominant") && a.has("submissive"))
	);
}

function normalizeCustomInterest(value: string) {
	return value.toLowerCase().replaceAll(/[^\p{L}\p{N}]/gu, "");
}

export const PillCollection: FC<{ user: User }> = (props) => {
	const { user } = props;

	const session = useOptionalSession();

	const { t } = useTranslation();
	const [locale] = useLocale();
	const [{ data: interestsById }, { data: languages }, { data: relationships }, { data: kinks }] = useSuspenseQueries({
		queries: [
			queryOptions({ ...interestsOptions({ locale }), select: byId }),
			queryOptions({ ...languagesOptions({ locale }), select: byId }),
			relationshipsOptions({ locale }),
			kinksOptions({ locale })
		]
	});
	const gameStoreLinks = useGameStoreLinks(useSessionGameStores());

	if (!session) return null;

	const editable = session.user.id === user.id;
	const nsfw = session.user.preferences?.nsfw ?? false;
	const kinkIds = nsfw ? user.profile.kinks : undefined;
	const activeKinkIds = (session.user.profile.kinks || [])
		.map((id) => kinks.find((kink) => kink.id === id)?.pair)
		.filter(Boolean);

	const relationshipIndex = (id: string) => {
		const index = relationships.findIndex((relationship) => relationship.id === id);
		return index === -1 ? relationships.length : index;
	};

	const languageNames = new Intl.DisplayNames(intlLocale(locale), {
		type: "language"
	});

	function getPersonalityLabels({
		profile: { openness, conscientiousness, agreeableness }
	}: User) {
		if (!personality) return [];
		if (!openness || !conscientiousness || !agreeableness) return [];

		return [
			t(openness > 0 ? "open_minded" : "practical"),
			t(conscientiousness > 0 ? "reliable" : "free_spirited"),
			t(agreeableness > 0 ? "friendly" : "straightforward")
		];
	}

	const sessionPersonalityLabels = getPersonalityLabels(session.user);
	const personalityLabels = getPersonalityLabels(user);

	const sessionCustomInterests = session.user.profile.customInterests.map(
		(customInterest) => normalizeCustomInterest(customInterest)
	);

	const interests = [
		...(user.profile.interests ?? [])
			.map((id) => ({
				key: id,
				name: interestsById[id]?.name ?? id,
				active:
					session.user.id !== user.id
					&& !!session.user.profile.interests?.includes(id)
			}))
			.sort((a, b) => a.name.localeCompare(b.name)),
		...(customInterests ? user.profile.customInterests : []).map((customInterest) => ({
			key: customInterest,
			name: customInterest,
			active:
				session.user.id !== user.id
				&& sessionCustomInterests.includes(
					normalizeCustomInterest(customInterest)
				)
		}))
	].sort((a, b) => Number(b.active) - Number(a.active));

	return (
		<div className="flex flex-wrap gap-4">
			<PillEntryList
				ids={[...(user.profile.relationships ?? [])].sort(
					(a, b) => relationshipIndex(a) - relationshipIndex(b)
				)}
				activeIds={session.user.profile.relationships}
				href={editable ? urls.settings.matchmaking() : undefined}
				options={relationshipsOptions}
				user={user}
			/>
			<PillEntryList
				activeIds={session.user.profile.sexualities}
				href={editable ? urls.settings.info("sexuality") : undefined}
				ids={user.profile.sexualities}
				options={sexualitiesOptions}
				user={user}
			/>
			{personalityLabels.length > 0 && (
				<PillRows editable={editable}>
					{personalityLabels.map((personalityLabel) => (
						<Pill
							key={personalityLabel}
							active={
								session.user.id !== user.id
								&& sessionPersonalityLabels.includes(personalityLabel)
							}
							href={editable ? urls.settings.personality : undefined}
						>
							{personalityLabel}
						</Pill>
					))}
				</PillRows>
			)}
			<PillRows editable={editable}>
				{interests.map(({ key, name, active }) => (
					<Pill
						key={key}
						active={active}
						href={editable ? urls.settings.interests : undefined}
					>
						{name}
					</Pill>
				))}
			</PillRows>
			{vrTags && (
				<PillEntryList
					activeIds={session.user.profile.games}
					getLinks={gameStoreLinks}
					href={editable ? urls.settings.info("game") : undefined}
					ids={user.profile.games}
					options={gamesOptions}
					user={user}
				/>
			)}
			{nsfw && user.profile.domsub && (
				<div className="flex w-full flex-wrap gap-2">
					<Pill
						active={
							session.user.id !== user.id
							&& isDomsubMatch(user.profile.domsub, session.user.profile.domsub)
						}
						href={editable ? urls.settings.nsfw : undefined}
					>
						{t(user.profile.domsub)}
					</Pill>
				</div>
			)}
			{user.profile.monopoly && (
				<div className="flex w-full flex-wrap gap-2">
					<Pill
						active={
							session.user.id !== user.id
							&& session.user.profile.monopoly === user.profile.monopoly
						}
						className="vision:bg-white-30/70"
						href={editable ? urls.settings.matchmaking() : undefined}
					>
						{t(user.profile.monopoly)}
					</Pill>
				</div>
			)}
			<PillEntryList
				activeIds={activeKinkIds}
				href={editable ? urls.settings.nsfw : undefined}
				ids={kinkIds}
				options={kinksOptions}
				user={user}
			/>
			<PillEntryList
				activeIds={session.user.profile.languages}
				getName={(id) => languages[id]?.name ?? languageNames.of(id) ?? id}
				href={editable ? urls.settings.info("language") : undefined}
				ids={user.profile.languages}
				options={languagesOptions}
				user={user}
			/>
			{vrTags && (
				<PillEntryList
					activeIds={session.user.profile.platforms}
					href={editable ? urls.settings.info("platform") : undefined}
					ids={user.profile.platforms}
					options={platformsOptions}
					user={user}
				/>
			)}
			{playlists && user.profile.playlist && (
				<ProfilePlaylist className="mt-4" playlist={user.profile.playlist} />
			)}
		</div>
	);
};
