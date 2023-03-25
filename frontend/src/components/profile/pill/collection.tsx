"use client";

import { EllipsisHorizontalIcon } from "@heroicons/react/24/solid";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";

import { Attribute } from "~/api/attributes";
import { User } from "~/api/user";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";
import { capitalize, groupBy } from "~/utilities";

import { Pill } from "./pill";

function getPersonalityLabels({ profile: { openness, conscientiousness, agreeableness } }: User) {
	if (!openness || !conscientiousness || !agreeableness) return [];

	return [
		openness > 0 ? "Open-minded" : "Practical",
		conscientiousness > 0 ? "Reliable" : "Free-spirited",
		agreeableness > 0 ? "Friendly" : "Straightforward"
	];
}

interface PillAttributeListProps {
	attributes?: Array<Attribute>;
	user: User;
	href?: string;
}

const PillAttributeList: React.FC<PillAttributeListProps> = ({ user, attributes, href }) => {
	const [session] = useSession();
	if (!session) return null;

	const sessionAttributeIds = session.user.profile.attributes.map(({ id }) => id);

	if (!attributes?.length) return null;

	return (
		<div className="flex w-full flex-wrap gap-2">
			{attributes.map(({ id, name }) => (
				<Pill
					active={session.user.id !== user.id && sessionAttributeIds.includes(id)}
					href={href}
					key={id}
				>
					{name}
				</Pill>
			))}
		</div>
	);
};

export const PillCollection: React.FC<{ user: User }> = (props) => {
	const [session] = useSession();
	const { user } = props;

	const [expanded, setExpanded] = useState(false);

	const allAttributes = [
		...useAttributeList("sexuality"),
		...useAttributeList("game"),
		...useAttributeList("interest"),
		...useAttributeList("platform"),
		...useAttributeList("language"),
		...useAttributeList("kink")
	];

	if (!session) return null;

	const sessionPersonalityLabels = getPersonalityLabels(session.user);
	const personalityLabels = getPersonalityLabels(user);

	const attributes = groupBy(
		[...user.profile.attributes.map(({ id }) => id), ...user.profile.languages]
			.map((attribute) => allAttributes.find(({ id }) => attribute === id))
			.filter(Boolean),
		({ type }) => type
	);

	return (
		<AnimatePresence>
			<div className="flex flex-wrap gap-4">
				<div className="flex w-full">
					{user.profile.serious && (
						<Pill href={urls.settings.matchmaking()}>Open to serious dating</Pill>
					)}
				</div>
				<PillAttributeList
					attributes={attributes.sexuality}
					href={urls.settings.tags("sexuality")}
					user={user}
				/>
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
				<PillAttributeList
					attributes={attributes.interest}
					href={urls.settings.tags("interest")}
					user={user}
				/>
				<PillAttributeList
					attributes={attributes.game}
					href={urls.settings.tags("game")}
					user={user}
				/>
				{user.profile.domsub && (
					<div className="flex w-full flex-wrap gap-2">
						<Pill href={urls.settings.matchmaking()}>{capitalize(user.profile.domsub)}</Pill>
					</div>
				)}
				{expanded ? (
					<>
						{user.profile.monopoly && (
							<div className="flex w-full flex-wrap gap-2">
								<Pill href={urls.settings.matchmaking()}>{capitalize(user.profile.monopoly)}</Pill>
							</div>
						)}
						<PillAttributeList attributes={attributes.kink} href={urls.settings.nsfw} user={user} />
						<PillAttributeList
							attributes={attributes.language}
							href={urls.settings.tags("language")}
							user={user}
						/>
						<PillAttributeList
							attributes={attributes.platform}
							href={urls.settings.tags("platform")}
							user={user}
						/>
					</>
				) : (
					<button type="button" onClick={() => setExpanded(true)}>
						<EllipsisHorizontalIcon className="h-8 w-8" />
					</button>
				)}
			</div>
		</AnimatePresence>
	);
};
