"use client";

import { useMessages, useTranslations } from "next-intl";
import type { FC, PropsWithChildren } from "react";

import type { User } from "~/api/user";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

import { PillAttributeList } from "./attribute-list";
import { PillCollectionExpansion } from "./expansion";
import { Pill } from "./pill";

function isDomsubMatch(value1: string | undefined, value2: string | undefined) {
	const a = new Set([value1, value2]);
	return (
		(value1 === "switch" && value2 === "switch")
		|| (a.has("dominant") && a.has("submissive"))
	);
}

const PillGroup: FC<PropsWithChildren> = ({ children }) => {
	return <div className="flex w-full flex-wrap gap-2">{children}</div>;
};

export const PillCollection: FC<{ user: User }> = (props) => {
	const { user } = props;

	const [session] = useSession();
	const t = useTranslations();
	const { attributes: tAttributes } = useMessages() as {
		attributes: Record<string, { name: string; definition?: string }>;
	};

	if (!session) return null;

	const editable = session.user.id === user.id;

	function getPersonalityLabels({
		profile: { openness, conscientiousness, agreeableness }
	}: User) {
		if (!openness || !conscientiousness || !agreeableness) return [];

		return [
			t("profile.personality.openness", {
				value: openness > 0 ? "high" : "low"
			}),
			t("profile.personality.conscientiousness", {
				value: conscientiousness > 0 ? "high" : "low"
			}),
			t("profile.personality.agreeableness", {
				value: agreeableness > 0 ? "high" : "low"
			})
		];
	}

	const sessionPersonalityLabels = getPersonalityLabels(session.user);
	const personalityLabels = getPersonalityLabels(user);

	return (
		<div className="flex flex-wrap gap-4">
			<PillAttributeList
				activeIds={session.user.profile.relationships}
				attributes={user.profile.relationships}
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
				<PillGroup>
					{personalityLabels.map((personalityLabel) => (
						<Pill
							active={
								session.user.id !== user.id
								&& sessionPersonalityLabels.includes(personalityLabel)
							}
							href={editable ? urls.settings.personality : undefined}
							key={personalityLabel}
						>
							{personalityLabel}
						</Pill>
					))}
				</PillGroup>
			)}
			<PillGroup>
				{user.profile.attributes.interest?.map((id) => {
					const { name } = tAttributes[id] ?? { name: id };

					return (
						<Pill
							active={session.user.id !== user.id && session.user.profile.attributes.interest?.includes(id)}
							href={editable ? urls.settings.interests : undefined}
							key={id}
						>
							{name}
						</Pill>
					);
				})}
				{user.profile.customInterests.map((customInterest) => {
					const regex = /[^\p{L}\p{N}]/gu;
					const customInterestId = customInterest
						.toLowerCase()
						.replaceAll(regex, "");

					return (
						<Pill
							active={
								session.user.id !== user.id
								&& session.user.profile.customInterests
									.map((interest) =>
										interest.toLowerCase().replaceAll(regex, "")
									)
									.includes(customInterestId)
							}
							href={editable ? urls.settings.interests : undefined}
							key={customInterest}
						>
							{customInterest}
						</Pill>
					);
				})}
			</PillGroup>
			<PillAttributeList
				attributes={user.profile.attributes.game}
				href={editable ? urls.settings.info("game") : undefined}
				user={user}
			/>
			{user.profile.domsub && (
				<div className="flex w-full flex-wrap gap-2">
					<Pill
						active={
							session.user.id !== user.id
							&& isDomsubMatch(user.profile.domsub, session.user.profile.domsub)
						}
						href={editable ? urls.settings.nsfw : undefined}
					>
						{t("profile.dark_level_goat_gulp", { value: user.profile.domsub })}
					</Pill>
				</div>
			)}
			<PillCollectionExpansion
				attributes={{}}
				editable={editable}
				session={session}
				user={user}
			/>
		</div>
	);
};
