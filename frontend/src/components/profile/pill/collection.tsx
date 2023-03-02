"use client";

import { User } from "~/api/user";
import { useCurrentUser } from "~/hooks/use-current-user";

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
	const { data: self } = useCurrentUser();
	const { user } = props;

	if (!self) return null;

	const myPersonalityLabels = getPersonalityLabels(self);
	const personalityLabels = getPersonalityLabels(user);

	return (
		<div className="flex flex-wrap gap-2">
			{user.profile.serious && <Pill>Open to serious dating</Pill>}
			{personalityLabels.map((personalityLabel) => (
				<Pill active={myPersonalityLabels.includes(personalityLabel)} key={personalityLabel}>
					{personalityLabel}
				</Pill>
			))}
			{user.profile.sexuality.map((sexuality) => (
				<Pill
					active={self.profile.sexuality.some((attribute) => attribute.id === sexuality.id)}
					key={sexuality.id}
				>
					{sexuality.name}
				</Pill>
			))}
			{user.profile.games.map((game) => (
				<Pill
					active={self.profile.games.some((attribute) => attribute.id === game.id)}
					key={game.id}
				>
					{game.name}
				</Pill>
			))}
			{user.profile.interests.map((interest) => (
				<Pill
					active={self.profile.interests.some((attribute) => attribute.id === interest.id)}
					key={interest.id}
				>
					{interest.name}
				</Pill>
			))}
		</div>
	);
};
