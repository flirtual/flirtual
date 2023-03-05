"use client";

import { User } from "~/api/user";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { useSession } from "~/hooks/use-session";
import { filterBy, findBy } from "~/utilities";

import { Pill } from "./pill";

function getPersonalityLabels({ profile: { openness, conscientiousness, agreeableness } }: User) {
	if (!openness || !conscientiousness || !agreeableness) return [];

	return [
		openness > 0 ? "Open-minded" : "Practical",
		conscientiousness > 0 ? "Reliable" : "Free-spirited",
		agreeableness > 0 ? "Friendly" : "Straightforward"
	];
}

export const PillCollection: React.FC<{ user: User }> = (props) => {
	const [session] = useSession();
	const { user } = props;

	const sexualities = useAttributeList("sexuality");

	if (!session) return null;

	const sessionPersonalityLabels = getPersonalityLabels(session.user);
	const personalityLabels = getPersonalityLabels(user);

	return (
		<div className="flex flex-wrap gap-2">
			{user.profile.serious && <Pill>Open to serious dating</Pill>}
			{personalityLabels.map((personalityLabel) => (
				<Pill active={sessionPersonalityLabels.includes(personalityLabel)} key={personalityLabel}>
					{personalityLabel}
				</Pill>
			))}
			{filterBy(user.profile.attributes, "type", "sexuality").map(({ id }) => {
				const attribute = findBy(sexualities, "id", id);
				if (!attribute) return null;

				return (
					<Pill
						active={!!findBy(session.user.profile.attributes, "id", attribute.id)}
						key={attribute.id}
					>
						{attribute.name}
					</Pill>
				);
			})}
			{filterBy(user.profile.attributes, "type", "game").map(({ id }) => {
				const attribute = findBy(sexualities, "id", id);
				if (!attribute) return null;

				return (
					<Pill
						active={!!findBy(session.user.profile.attributes, "id", attribute.id)}
						key={attribute.id}
					>
						{attribute.name}
					</Pill>
				);
			})}
			{filterBy(user.profile.attributes, "type", "interest").map(({ id }) => {
				const attribute = findBy(sexualities, "id", id);
				if (!attribute) return null;

				return (
					<Pill
						active={!!findBy(session.user.profile.attributes, "id", attribute.id)}
						key={attribute.id}
					>
						{attribute.name}
					</Pill>
				);
			})}
		</div>
	);
};
