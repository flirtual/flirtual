"use client";

import { FC, useState } from "react";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/solid";

import { Pill } from "./pill";
import { PillAttributeList } from "./attribute-list";

import { User } from "~/api/user";
import { ProfileMonopolyLabel } from "~/api/user/profile";
import { urls } from "~/urls";
import { Attribute } from "~/api/attributes";

export interface PillCollectionExpansionProps {
	user: User;
	editable: boolean;
	attributes: Record<string, Array<Attribute>>;
}

export const PillCollectionExpansion: FC<PillCollectionExpansionProps> = (
	props
) => {
	const { editable, user, attributes } = props;
	const [expanded, setExpanded] = useState(false);

	return expanded ? (
		<>
			{user.profile.monopoly && (
				<div className="flex w-full flex-wrap gap-2">
					<Pill href={editable ? urls.settings.matchmaking() : undefined}>
						{ProfileMonopolyLabel[user.profile.monopoly]}
					</Pill>
				</div>
			)}
			<PillAttributeList
				attributes={attributes.kink}
				href={editable ? urls.settings.nsfw : undefined}
				user={user}
			/>
			<PillAttributeList
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
