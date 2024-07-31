"use client";

import { urls } from "~/urls";
import { capitalize, groupBy } from "~/utilities";
import { useSession } from "~/hooks/use-session";
import { useAttributeList } from "~/hooks/use-attribute-list";

import { PillAttributeList } from "./attribute-list";
import { PillCollectionExpansion } from "./expansion";
import { Pill } from "./pill";

import type { User } from "~/api/user";
import type { FC } from "react";

function getPersonalityLabels({
	profile: { openness, conscientiousness, agreeableness }
}: User) {
	if (!openness || !conscientiousness || !agreeableness) return [];

	return [
		openness > 0 ? "Open-minded" : "Practical",
		conscientiousness > 0 ? "Reliable" : "Free-spirited",
		agreeableness > 0 ? "Friendly" : "Straightforward"
	];
}

function isDomsubMatch(value1: string | undefined, value2: string | undefined) {
	const a = new Set([value1, value2]);
	return (
		(value1 === "switch" && value2 === "switch") ||
		(a.has("dominant") && a.has("submissive"))
	);
}

export const PillCollection: FC<{ user: User }> = (props) => {
	const { user } = props;

	const [session] = useSession();

	const allAttributes = [
		...useAttributeList("sexuality"),
		...useAttributeList("game"),
		...useAttributeList("interest"),
		...useAttributeList("platform"),
		...useAttributeList("kink"),
		...useAttributeList("language"),
		...useAttributeList("relationship")
	];

	const profileAttributeIds = new Set(
		new Set(user.profile.attributes.map(({ id }) => id))
	);

	if (!session) return null;

	const sessionAttributeIds = new Set(
		session.user.profile.attributes.map(({ id }) => id)
	);

	const editable = session.user.id === user.id;

	const sessionPersonalityLabels = getPersonalityLabels(session.user);
	const personalityLabels = getPersonalityLabels(user);

	const attributes = groupBy(
		allAttributes.filter(
			({ id }) =>
				profileAttributeIds.has(id) ||
				user.profile.languages.includes(id) ||
				user.profile.relationships.includes(id)
		),
		({ type }) => type
	);

	return (
		<div className="flex flex-wrap gap-4">
			<PillAttributeList
				activeIds={session.user.profile.relationships}
				attributes={attributes.relationship}
				href={editable ? urls.settings.matchmaking() : undefined}
				user={user}
			/>
			<PillAttributeList
				attributes={attributes.sexuality}
				href={editable ? urls.settings.info("sexuality") : undefined}
				user={user}
			/>
			{personalityLabels.length > 0 && (
				<div className="flex w-full flex-wrap gap-2">
					{personalityLabels.map((personalityLabel) => (
						<Pill
							className="vision:bg-white-30/70"
							href={editable ? urls.settings.personality : undefined}
							key={personalityLabel}
							active={
								session.user.id !== user.id &&
								sessionPersonalityLabels.includes(personalityLabel)
							}
						>
							{personalityLabel}
						</Pill>
					))}
				</div>
			)}
			<div className="flex w-full flex-wrap gap-2">
				{(attributes.interest ?? []).map(({ id, name }) => (
					<Pill
						active={session.user.id !== user.id && sessionAttributeIds.has(id)}
						className="vision:bg-white-30/70"
						href={editable ? urls.settings.interests : undefined}
						key={id}
					>
						{name}
					</Pill>
				))}
				{user.profile.customInterests.map((customInterest) => (
					<Pill
						className="vision:bg-white-30/70"
						href={editable ? urls.settings.interests : undefined}
						key={customInterest}
						active={
							session.user.id !== user.id &&
							session.user.profile.customInterests
								.map((interest) =>
									interest.toLowerCase().replaceAll(/[^\p{L}\p{N}]/gu, "")
								)
								.includes(
									customInterest.toLowerCase().replaceAll(/[^\p{L}\p{N}]/gu, "")
								)
						}
					>
						{customInterest}
					</Pill>
				))}
			</div>
			<PillAttributeList
				attributes={attributes.game}
				href={editable ? urls.settings.info("game") : undefined}
				user={user}
			/>
			{user.profile.domsub && (
				<div className="flex w-full flex-wrap gap-2">
					<Pill
						className="vision:bg-white-30/70"
						href={editable ? urls.settings.nsfw : undefined}
						active={
							session.user.id !== user.id &&
							isDomsubMatch(user.profile.domsub, session.user.profile.domsub)
						}
					>
						{capitalize(user.profile.domsub)}
					</Pill>
				</div>
			)}
			<PillCollectionExpansion
				attributes={attributes}
				editable={editable}
				session={session}
				user={user}
			/>
		</div>
	);
};
