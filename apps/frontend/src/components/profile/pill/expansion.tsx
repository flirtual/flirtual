import { MoreHorizontal } from "lucide-react";
import { useLocale } from "next-intl";
import { type FC, useMemo, useState } from "react";

import type { Session } from "~/api/auth";
import type { User } from "~/api/user";
import { useAttributes, useAttributeTranslation } from "~/hooks/use-attribute";
import { urls } from "~/urls";

import { ProfilePlaylist } from "../playlist";
import { PillAttributeList } from "./attribute-list";
import { Pill } from "./pill";

export interface PillCollectionExpansionProps {
	user: User;
	editable: boolean;
	session: Session;
}

export const PillCollectionExpansion: FC<PillCollectionExpansionProps> = (
	props
) => {
	const { editable, user, session } = props;
	const [expanded, setExpanded] = useState(false);
	const { t } = useTranslation();
	const tAttribute = useAttributeTranslation();

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
		&& !user.profile.attributes.kink
		&& !user.profile.attributes.language
		&& !user.profile.attributes.platform
		&& !user.profile.playlist
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
						getName={(id) => tAttribute[id]?.name ?? languageNames.of(id) ?? id}
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
