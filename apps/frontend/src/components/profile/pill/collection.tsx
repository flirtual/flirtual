import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type { User } from "~/api/user";
import { personality, playlists, vrTags } from "~/features";
import {
	useAttributeOrder,
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import { useGameStoreLinks, useSessionGameStores } from "~/hooks/use-game-stores";
import { useOptionalSession } from "~/hooks/use-session";
import { useLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";
import { urls } from "~/urls";

import { ProfilePlaylist } from "../playlist";
import { PillAttributeList } from "./attribute-list";
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
	const tAttributes = useAttributeTranslation();
	const relationshipOrder = useAttributeOrder("relationship");
	const gameStoreLinks = useGameStoreLinks(useSessionGameStores());
	const kinks = useAttributes("kink");
	const [locale] = useLocale();

	if (!session) return null;

	const editable = session.user.id === user.id;
	const nsfw = session.user.preferences?.nsfw ?? false;
	const kinkIds = nsfw ? user.profile.attributes.kink : undefined;
	const activeKinkIds = (session.user.profile.attributes.kink || [])
		.map((id) => kinks.find((kink) => kink.id === id)?.pair)
		.filter(Boolean);

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
		...(user.profile.attributes.interest ?? [])
			.map((id) => ({
				key: id,
				name: tAttributes[id]?.name ?? id,
				active:
					session.user.id !== user.id
					&& !!session.user.profile.attributes.interest?.includes(id)
			}))
			.sort((a, b) => a.name.localeCompare(b.name)),
		...user.profile.customInterests.map((customInterest) => ({
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
			<PillAttributeList
				attributes={[...(user.profile.relationships ?? [])].sort(
					relationshipOrder
				)}
				activeIds={session.user.profile.relationships}
				href={editable ? urls.settings.matchmaking() : undefined}
				user={user}
			/>
			<PillAttributeList
				activeIds={session.user.profile.attributes.sexuality}
				attributes={user.profile.attributes.sexuality}
				href={editable ? urls.settings.info("sexuality") : undefined}
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
				<PillAttributeList
					attributes={user.profile.attributes.game}
					getLinks={gameStoreLinks}
					href={editable ? urls.settings.info("game") : undefined}
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
			<PillAttributeList
				activeIds={activeKinkIds}
				attributes={kinkIds}
				href={editable ? urls.settings.nsfw : undefined}
				user={user}
			/>
			<PillAttributeList
				activeIds={session.user.profile.languages}
				attributes={user.profile.languages}
				getName={(id) => tAttributes[id]?.name ?? languageNames.of(id) ?? id}
				href={editable ? urls.settings.info("language") : undefined}
				user={user}
			/>
			{vrTags && (
				<PillAttributeList
					attributes={user.profile.attributes.platform}
					href={editable ? urls.settings.info("platform") : undefined}
					user={user}
				/>
			)}
			{playlists && user.profile.playlist && (
				<ProfilePlaylist className="mt-4" playlist={user.profile.playlist} />
			)}
		</div>
	);
};
