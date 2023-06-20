import { User } from "~/api/user";
import { urls } from "~/urls";
import { capitalize, groupBy } from "~/utilities";
import { withSession } from "~/server-utilities";
import { withAttribute } from "~/api/attributes-server";

import { PillAttributeList } from "./attribute-list";
import { PillCollectionExpansion } from "./expansion";
import { Pill } from "./pill";

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

export async function PillCollection(props: { user: User }) {
	const session = await withSession();
	const { user } = props;

	const sessionAttributeIds = new Set(
		session.user.profile.attributes.map(({ id }) => id)
	);
	const editable = session.user.id === user.id;

	const sessionPersonalityLabels = getPersonalityLabels(session.user);
	const personalityLabels = getPersonalityLabels(user);

	const attributes = groupBy(
		await Promise.all([
			...user.profile.attributes.map(({ type, id }) => withAttribute(type, id)),
			...user.profile.languages.map((id) => withAttribute("language", id))
		]),
		({ type }) => type
	);

	return (
		<div className="flex flex-wrap gap-4">
			<div className="flex w-full">
				{user.profile.serious && (
					<Pill
						active={session.user.id !== user.id && session.user.profile.serious}
						href={editable ? urls.settings.matchmaking() : undefined}
					>
						Open to serious dating
					</Pill>
				)}
			</div>
			<PillAttributeList
				attributes={attributes.sexuality}
				href={editable ? urls.settings.tags("sexuality") : undefined}
				user={user}
			/>
			{personalityLabels.length > 0 && (
				<div className="flex w-full flex-wrap gap-2">
					{personalityLabels.map((personalityLabel) => (
						<Pill
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
						href={editable ? urls.settings.tags("interest") : undefined}
						key={id}
					>
						{name}
					</Pill>
				))}
				{user.profile.customInterests.map((customInterest) => (
					<Pill
						href={editable ? urls.settings.tags("interest") : undefined}
						key={customInterest}
						active={
							session.user.id !== user.id &&
							session.user.profile.customInterests.includes(customInterest)
						}
					>
						{customInterest}
					</Pill>
				))}
			</div>
			<PillAttributeList
				attributes={attributes.game}
				href={editable ? urls.settings.tags("game") : undefined}
				user={user}
			/>
			{user.profile.domsub && (
				<div className="flex w-full flex-wrap gap-2">
					<Pill
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
}
