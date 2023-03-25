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

	const allSexualities = useAttributeList("sexuality");
	const allGames = useAttributeList("game");
	const allInterests = useAttributeList("interest");

	if (!session) return null;

	const sessionPersonalityLabels = getPersonalityLabels(session.user);
	const personalityLabels = getPersonalityLabels(user);

	const sexualities = filterBy(user.profile.attributes, "type", "sexuality");

	return (
		<div className="flex flex-wrap gap-4">
			{user.profile.serious && <Pill>Open to serious dating</Pill>}
			{sexualities.length !== 0 && (
				<div className="flex w-full flex-wrap gap-2">
					{sexualities.map(({ id }) => {
						const attribute = findBy(allSexualities, "id", id);
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
			)}
			{personalityLabels.length !== 0 && (
				<div className="flex w-full flex-wrap gap-2">
					{personalityLabels.map((personalityLabel) => (
						<Pill
							active={sessionPersonalityLabels.includes(personalityLabel)}
							key={personalityLabel}
						>
							{personalityLabel}
						</Pill>
					))}
				</div>
			)}
			<div className="flex w-full flex-wrap gap-2">
				{filterBy(user.profile.attributes, "type", "interest").map(({ id }) => {
					const attribute = findBy(allInterests, "id", id);
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
			<div className="flex w-full flex-wrap gap-2">
				{filterBy(user.profile.attributes, "type", "game").map(({ id }) => {
					const attribute = findBy(allGames, "id", id);
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
		</div>
	);
};
