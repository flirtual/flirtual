"use client";

import { MoreHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type FC, useMemo, useState } from "react";

import type { AttributeType, MinimalAttribute } from "~/api/attributes";
import type { Session } from "~/api/auth";
import type { User } from "~/api/user";
import { useAttributes } from "~/hooks/use-attribute";
import { urls } from "~/urls";

import { ProfilePlaylist } from "../playlist";
import { PillAttributeList } from "./attribute-list";
import { Pill } from "./pill";

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
	const t = useTranslations();

	const kinks = useAttributes("kink");
	const activeKinkIds = useMemo(
		() =>
			(session.user.profile.attributes.kink || [])
				.map((id) => kinks.find((kink) => kink.id === id)?.pair)
				.filter(Boolean),
		[kinks, session.user.profile.attributes]
	);

	const locale = useLocale();

	const languageNames = new Intl.DisplayNames(locale, {
		type: "language"
	});

	if (
		!user.profile.monopoly
		&& !attributes.kink
		&& !attributes.language
		&& !attributes.platform
	) {
		return null;
	}

	return expanded
		? (
				<>
					{user.profile.monopoly && (
						<div className="flex w-full flex-wrap gap-2">
							<Pill
								active={
									session.user.id !== user.id
									&& session.user.profile.monopoly === user.profile.monopoly
								}
								className="vision:bg-white-30/70"
								href={editable ? urls.settings.matchmaking() : undefined}
							>
								{t(user.profile.monopoly)}
							</Pill>
						</div>
					)}
					<PillAttributeList
						activeIds={activeKinkIds}
						attributes={user.profile.attributes.kink}
						href={editable ? urls.settings.nsfw : undefined}
						user={user}
					/>
					<PillAttributeList
						activeIds={session.user.profile.languages}
						attributes={user.profile.languages}
						getName={(id) => languageNames.of(id) || id}
						href={editable ? urls.settings.info("language") : undefined}
						user={user}
					/>
					<PillAttributeList
						attributes={user.profile.attributes.platform}
						href={editable ? urls.settings.info("platform") : undefined}
						user={user}
					/>
					{user.profile.playlist && (
						<ProfilePlaylist className="mt-4" playlist={user.profile.playlist} />
					)}
					<div />
				</>
			)
		: (
				<button type="button" onClick={() => setExpanded(true)}>
					<MoreHorizontal className="size-8 vision:text-white-20" />
				</button>
			);
};
