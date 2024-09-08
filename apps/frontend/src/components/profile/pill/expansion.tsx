"use client";

import { type FC, useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { urls } from "~/urls";
import { filterBy } from "~/utilities";
import { useAttributeList } from "~/hooks/use-attribute-list";

import { ProfilePlaylist } from "../playlist";

import { PillAttributeList } from "./attribute-list";
import { Pill } from "./pill";

import type {
	Attribute,
	AttributeType,
	MinimalAttribute
} from "~/api/attributes";
import type { Session } from "~/api/auth";
import type { User } from "~/api/user";

export interface PillCollectionExpansionProps {
	user: User;
	editable: boolean;
	attributes: Record<string, Array<MinimalAttribute<AttributeType>>>;
	session: Session;
}

export const PillCollectionExpansion: FC<PillCollectionExpansionProps> = (
	props
) => {
	const { editable, user, attributes, session } = props;
	const [expanded, setExpanded] = useState(false);
	const t = useTranslations("profile");

	const kinks = useAttributeList("kink");
	// const activeKinkIds = useMemo(
	// 	() =>
	// 		filterBy(session.user.profile.attributes, "type", "kink")
	// 			.map(({ id }) => kinks.find((kink) => kink.id === id)?.metadata.pair)
	// 			.filter(Boolean),
	// 	[kinks, session.user.profile.attributes]
	// );

	if (
		!user.profile.monopoly &&
		!attributes.kink &&
		!attributes.language &&
		!attributes.platform
	) {
		return null;
	}

	return expanded ? (
		<>
			{user.profile.monopoly && (
				<div className="flex w-full flex-wrap gap-2">
					<Pill
						className="vision:bg-white-30/70"
						href={editable ? urls.settings.matchmaking() : undefined}
						active={
							session.user.id !== user.id &&
							session.user.profile.monopoly === user.profile.monopoly
						}
					>
						{t("brave_funny_vulture_sail", { value: user.profile.monopoly })}
					</Pill>
				</div>
			)}
			<PillAttributeList
				// activeIds={activeKinkIds}
				attributes={attributes.kink}
				href={editable ? urls.settings.nsfw : undefined}
				user={user}
			/>
			<PillAttributeList
				activeIds={session.user.profile.languages}
				attributes={attributes.language}
				href={editable ? urls.settings.info("language") : undefined}
				user={user}
			/>
			<PillAttributeList
				attributes={attributes.platform}
				href={editable ? urls.settings.info("platform") : undefined}
				user={user}
			/>
			{user.profile.playlist && (
				<ProfilePlaylist className="mt-4" playlist={user.profile.playlist} />
			)}
			<div />
		</>
	) : (
		<button type="button" onClick={() => setExpanded(true)}>
			<MoreHorizontal className="size-8 vision:text-white-20" />
		</button>
	);
};
