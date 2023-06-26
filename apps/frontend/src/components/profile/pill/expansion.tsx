"use client";

import { FC, useMemo, useState } from "react";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/solid";

import { User } from "~/api/user";
import { Session } from "~/api/auth";
import { ProfileMonopolyLabel } from "~/api/user/profile";
import { urls } from "~/urls";
import { Attribute } from "~/api/attributes";
import { filterBy } from "~/utilities";
import { useAttributeList } from "~/hooks/use-attribute-list";

import { PillAttributeList } from "./attribute-list";
import { Pill } from "./pill";

export interface PillCollectionExpansionProps {
	user: User;
	editable: boolean;
	attributes: Record<string, Array<Attribute>>;
	session: Session;
}

export const PillCollectionExpansion: FC<PillCollectionExpansionProps> = (
	props
) => {
	const { editable, user, attributes, session } = props;
	const [expanded, setExpanded] = useState(false);

	const kinks = useAttributeList("kink");
	const activeKinkIds = useMemo(
		() =>
			filterBy(session.user.profile.attributes, "type", "kink")
				.map(({ id }) => kinks.find((kink) => kink.id === id)?.metadata.pair)
				.filter(Boolean),
		[kinks, session.user.profile.attributes]
	);

	return expanded ? (
		<>
			{user.profile.monopoly && (
				<div className="flex w-full flex-wrap gap-2">
					<Pill
						href={editable ? urls.settings.matchmaking() : undefined}
						active={
							session.user.id !== user.id &&
							session.user.profile.monopoly === user.profile.monopoly
						}
					>
						{ProfileMonopolyLabel[user.profile.monopoly]}
					</Pill>
				</div>
			)}
			<PillAttributeList
				activeIds={activeKinkIds}
				attributes={attributes.kink}
				href={editable ? urls.settings.nsfw : undefined}
				user={user}
			/>
			<PillAttributeList
				activeIds={session.user.profile.languages}
				attributes={attributes.language}
				href={editable ? urls.settings.tags("language") : undefined}
				user={user}
			/>
			<PillAttributeList
				attributes={attributes.platform}
				href={editable ? urls.settings.tags("platform") : undefined}
				user={user}
			/>
		</>
	) : (
		<button type="button" onClick={() => setExpanded(true)}>
			<EllipsisHorizontalIcon className="h-8 w-8" />
		</button>
	);
};
